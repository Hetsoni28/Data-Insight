"""Report Permission bindings mapped to roles based on our RBAC Matrix."""

# Report Specific Permissions
REPORT_VIEW = "report:view"
REPORT_CREATE = "report:create"
REPORT_EDIT = "report:edit"
REPORT_DELETE = "report:delete"
REPORT_EXPORT = "report:export"
REPORT_PUBLISH = "report:publish"
REPORT_SHARE = "report:share"
REPORT_SCHEDULE = "report:schedule"
REPORT_AI = "report:ai"

# Role Bindings
ROLE_PERMISSIONS = {
    "org_admin": [
        REPORT_VIEW, REPORT_CREATE, REPORT_EDIT, REPORT_DELETE, 
        REPORT_EXPORT, REPORT_PUBLISH, REPORT_SHARE, REPORT_SCHEDULE, REPORT_AI
    ],
    "manager": [
        REPORT_VIEW, REPORT_CREATE, REPORT_EDIT, REPORT_DELETE, 
        REPORT_EXPORT, REPORT_PUBLISH, REPORT_SHARE, REPORT_SCHEDULE, REPORT_AI
    ],
    "analyst": [
        REPORT_VIEW, REPORT_CREATE, REPORT_EDIT, REPORT_DELETE, 
        REPORT_EXPORT, REPORT_PUBLISH, REPORT_SHARE, REPORT_SCHEDULE, REPORT_AI
    ],
    "viewer": [
        REPORT_VIEW, REPORT_EXPORT, REPORT_AI
    ]
}

def has_report_permission(user_role: str, permission: str) -> bool:
    """Check if a specific role is granted the requested report permission."""
    return permission in ROLE_PERMISSIONS.get(user_role, [])
