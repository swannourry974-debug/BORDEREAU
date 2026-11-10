export const CATALOG_IMPORT_ADMIN_USER_ID = '69e8b7dafb460a4f0f638f98';

export async function requireCatalogImportAdmin(base44) {
  const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
  if (!user) {
    return { response: Response.json({ error: 'Authentification requise' }, { status: 401 }) };
  }
  if (user.id !== CATALOG_IMPORT_ADMIN_USER_ID || user.role !== 'admin') {
    return { response: Response.json({ error: 'Accès administrateur requis pour ce compte import' }, { status: 403 }), user };
  }
  return { user };
}