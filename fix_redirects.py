import os

path = r'frontend/src/components/organisms/LoginForm.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('/dashboard/datasets', '/dashboard')
content = content.replace('router.push("/datasets")', 'router.push("/dashboard")')

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

path2 = r'frontend/src/components/providers/AuthProvider.tsx'
with open(path2, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('/dashboard/datasets', '/dashboard')

with open(path2, 'w', encoding='utf-8') as f:
    f.write(content)

