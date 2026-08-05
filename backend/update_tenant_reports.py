import sys

path = r'c:\Users\Het\OneDrive\Desktop\data-insight\backend\app\api\v1\tenant_reports.py'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

target = """        if file_url:
            try:
                # Need await here since we discovered it was missing earlier in worker, assuming it's async in storage
                file_bytes = await download_file_bytes(REPORTS_BUCKET, file_url)
                output.write(file_bytes)
                output.seek(0)
            except Exception as e:
                pass # Fall back to dynamic generation
                
        await db.commit()"""

replacement = """        if file_url:
            try:
                # Need await here since we discovered it was missing earlier in worker, assuming it's async in storage
                file_bytes = await download_file_bytes(REPORTS_BUCKET, file_url)
                output.write(file_bytes)
                output.seek(0)
            except Exception as e:
                pass # Fall back to dynamic generation
                
        # If no file exists in storage or it failed, generate one dynamically from ai_blueprint
        if output.tell() == 0:
            if not report.ai_blueprint:
                raise HTTPException(status_code=404, detail="Report data not ready")
            
            from app.core.excel_generator import generate_excel_from_blueprint
            output = generate_excel_from_blueprint(report.ai_blueprint, report.title)
    
        audit = AuditLog(
            tenant_id=tenant_id, user_id=current_user.id, action="report.download",
            resource_type="report", resource_id=str(report.id), ip_address=request.client.host if request.client else "127.0.0.1"
        )
        db.add(audit)
        await db.commit()"""

if target in content:
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content.replace(target, replacement))
    print('Replaced successfully')
else:
    print('Target not found in file!')
