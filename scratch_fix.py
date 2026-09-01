import os

def replace_in_file(path, old, new):
    with open(path, 'r', encoding='utf-8') as f: content = f.read()
    if old in content:
        with open(path, 'w', encoding='utf-8') as f: f.write(content.replace(old, new))

# 1. GatewayDeveloperApps
app_file = 'frontend/src/components/organisms/GatewayDeveloperApps.tsx'
replace_in_file(app_file, '/developer/apps', '/owner/api-gateway/oauth-clients')
replace_in_file(app_file, 'setSaving(false)\n  }\n\n  return (', 'setSaving(false)\n    }\n  }\n\n  return (')
replace_in_file(app_file, 'setSaving(false)\r\n  }\r\n\r\n  return (', 'setSaving(false)\r\n    }\r\n  }\r\n\r\n  return (')

# 2. GatewayHeroBanner
hero_file = 'frontend/src/components/organisms/GatewayHeroBanner.tsx'
replace_in_file(hero_file, '/developer/keys', '/users/me/api-keys')
replace_in_file(hero_file, 'setCreatedKey(res.data.key)\n    } catch', 'setCreatedKey(res.data.key)\n      queryClient.invalidateQueries({ queryKey: [\'api-gateway\', \'overview\'] })\n      toast.success(`API Key "${name}" created successfully`)\n    } catch')
replace_in_file(hero_file, 'setCreatedKey(res.data.key)\r\n    } catch', 'setCreatedKey(res.data.key)\r\n      queryClient.invalidateQueries({ queryKey: [\'api-gateway\', \'overview\'] })\r\n      toast.success(`API Key "${name}" created successfully`)\r\n    } catch')
replace_in_file(hero_file, '    queryClient.invalidateQueries({ queryKey: [\'api-gateway\', \'overview\'] })\n    toast.success(`API Key "${name}" created successfully`)\n', '')
replace_in_file(hero_file, '    queryClient.invalidateQueries({ queryKey: [\'api-gateway\', \'overview\'] })\r\n    toast.success(`API Key "${name}" created successfully`)\r\n', '')
