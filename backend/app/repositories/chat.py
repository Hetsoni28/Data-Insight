"""ChatRepository — async persistence for multi-tenant chat sessions and messages."""

from __future__ import annotations

import uuid
from typing import Optional, List, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc
from sqlalchemy.orm import selectinload

from app.models.chat import ChatSession, ChatMessage
from app.repositories.base import BaseRepository


class ChatRepository(BaseRepository[ChatSession]):
    """Tenant-isolated repository for Copilot chat sessions and messages."""

    def __init__(self, session: AsyncSession):
        super().__init__(ChatSession, session)

    async def get_session(
        self,
        session_id: uuid.UUID | str,
        tenant_id: uuid.UUID | str,
        user_id: Optional[uuid.UUID | str] = None,
        load_messages: bool = True,
    ) -> Optional[ChatSession]:
        """Fetch a specific chat session with optional message eager loading."""
        if isinstance(session_id, str):
            session_id = uuid.UUID(session_id)
        if isinstance(tenant_id, str):
            tenant_id = uuid.UUID(tenant_id)

        stmt = (
            select(ChatSession)
            .where(
                ChatSession.id == session_id,
                ChatSession.tenant_id == tenant_id,
            )
            .execution_options(populate_existing=True)
        )
        if user_id:
            if isinstance(user_id, str):
                user_id = uuid.UUID(user_id)
            stmt = stmt.where(ChatSession.user_id == user_id)

        result = await self.session.execute(stmt)
        return result.scalars().first()

    async def list_sessions(
        self,
        tenant_id: uuid.UUID | str,
        user_id: uuid.UUID | str,
        dataset_id: Optional[uuid.UUID | str] = None,
        limit: int = 50,
        offset: int = 0,
    ) -> List[ChatSession]:
        """List chat sessions for a specific user within a tenant ordered by latest activity."""
        if isinstance(tenant_id, str):
            tenant_id = uuid.UUID(tenant_id)
        if isinstance(user_id, str):
            user_id = uuid.UUID(user_id)

        stmt = (
            select(ChatSession)
            .where(
                ChatSession.tenant_id == tenant_id,
                ChatSession.user_id == user_id,
            )
            .options(
                selectinload(ChatSession.messages),
                selectinload(ChatSession.dataset),
            )
            .order_by(desc(ChatSession.updated_at))
            .limit(limit)
            .offset(offset)
        )

        if dataset_id:
            if isinstance(dataset_id, str):
                dataset_id = uuid.UUID(dataset_id)
            stmt = stmt.where(ChatSession.dataset_id == dataset_id)

        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def count_sessions(
        self,
        tenant_id: uuid.UUID | str,
        user_id: uuid.UUID | str,
        dataset_id: Optional[uuid.UUID | str] = None,
    ) -> int:
        """Count total chat sessions for pagination."""
        if isinstance(tenant_id, str):
            tenant_id = uuid.UUID(tenant_id)
        if isinstance(user_id, str):
            user_id = uuid.UUID(user_id)

        stmt = select(func.count(ChatSession.id)).where(
            ChatSession.tenant_id == tenant_id,
            ChatSession.user_id == user_id,
        )
        if dataset_id:
            if isinstance(dataset_id, str):
                dataset_id = uuid.UUID(dataset_id)
            stmt = stmt.where(ChatSession.dataset_id == dataset_id)

        result = await self.session.execute(stmt)
        return result.scalar_one() or 0

    async def create_session(
        self,
        tenant_id: uuid.UUID | str,
        user_id: uuid.UUID | str,
        title: str = "New Chat",
        dataset_id: Optional[uuid.UUID | str] = None,
    ) -> ChatSession:
        """Create a new chat session."""
        if isinstance(tenant_id, str):
            tenant_id = uuid.UUID(tenant_id)
        if isinstance(user_id, str):
            user_id = uuid.UUID(user_id)
        if isinstance(dataset_id, str):
            dataset_id = uuid.UUID(dataset_id)

        new_session = ChatSession(
            tenant_id=tenant_id,
            user_id=user_id,
            title=title.strip() or "New Chat",
            dataset_id=dataset_id,
        )
        self.session.add(new_session)
        await self.session.flush()
        # Eagerly load relationship
        return await self.get_session(new_session.id, tenant_id, user_id) or new_session

    async def update_session(
        self,
        session_id: uuid.UUID | str,
        tenant_id: uuid.UUID | str,
        user_id: uuid.UUID | str,
        title: Optional[str] = None,
        dataset_id: Optional[uuid.UUID | str] = None,
    ) -> Optional[ChatSession]:
        """Update a chat session's title or bound dataset."""
        chat_sess = await self.get_session(session_id, tenant_id, user_id)
        if not chat_sess:
            return None

        if title is not None:
            chat_sess.title = title.strip()
        if dataset_id is not None:
            if isinstance(dataset_id, str) and dataset_id.strip():
                chat_sess.dataset_id = uuid.UUID(dataset_id)
            elif dataset_id is None:
                chat_sess.dataset_id = None

        await self.session.flush()
        return chat_sess

    async def delete_session(
        self,
        session_id: uuid.UUID | str,
        tenant_id: uuid.UUID | str,
        user_id: uuid.UUID | str,
    ) -> bool:
        """Delete a chat session and all cascade-deleted messages."""
        chat_sess = await self.get_session(
            session_id, tenant_id, user_id, load_messages=False
        )
        if not chat_sess:
            return False

        await self.session.delete(chat_sess)
        await self.session.flush()
        return True

    async def add_message(
        self,
        session_id: uuid.UUID | str,
        role: str,
        content: str,
        artifact_data: Optional[Dict[str, Any]] = None,
    ) -> ChatMessage:
        """Add a message to a session and touch the session updated_at."""
        if isinstance(session_id, str):
            session_id = uuid.UUID(session_id)

        msg = ChatMessage(
            session_id=session_id,
            role=role,
            content=content,
            artifact_data=artifact_data,
        )
        self.session.add(msg)

        # Update session updated_at
        stmt = select(ChatSession).where(ChatSession.id == session_id)
        res = await self.session.execute(stmt)
        sess_obj = res.scalars().first()
        if sess_obj:
            from datetime import datetime, timezone

            sess_obj.updated_at = datetime.now(timezone.utc)
            if (
                "messages" in sess_obj.__dict__
                and sess_obj.__dict__["messages"] is not None
            ):
                if msg not in sess_obj.messages:
                    sess_obj.messages.append(msg)

        await self.session.flush()
        return msg

    async def get_session_messages(
        self,
        session_id: uuid.UUID | str,
        limit: int = 100,
    ) -> List[ChatMessage]:
        """Fetch all messages in order for a session."""
        if isinstance(session_id, str):
            session_id = uuid.UUID(session_id)

        stmt = (
            select(ChatMessage)
            .where(ChatMessage.session_id == session_id)
            .order_by(ChatMessage.created_at.asc())
            .limit(limit)
        )
        result = await self.session.execute(stmt)
        return list(result.scalars().all())
