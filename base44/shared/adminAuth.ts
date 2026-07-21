export async function requireAdmin(base44) {
  const user = await base44.auth.me().catch(() => null);
  if (!user || user.role !== 'admin') {
    return {
      user: null,
      response: Response.json({ error: 'Forbidden' }, { status: 403 }),
    };
  }
  return { user, response: null };
}