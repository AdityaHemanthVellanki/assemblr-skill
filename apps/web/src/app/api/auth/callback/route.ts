import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { prisma } from '@assemblr/shared';
import { signToken } from '@/lib/auth';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');

  if (!code) {
    return NextResponse.redirect(`${origin}/?error=missing_code`);
  }

  try {
    // 1. Exchange the PKCE code for a Supabase session
    const supabase = await createSupabaseServerClient();
    const { data: { user: supabaseUser }, error: exchangeError } =
      await supabase.auth.exchangeCodeForSession(code);

    if (exchangeError || !supabaseUser?.email) {
      console.error('[oauth callback]', exchangeError?.message);
      return NextResponse.redirect(`${origin}/?error=oauth_failed`);
    }

    const email = supabaseUser.email.toLowerCase();
    const name = supabaseUser.user_metadata?.full_name
      || supabaseUser.user_metadata?.name
      || email.split('@')[0];

    // 2. Look up existing user by email
    let user = await prisma.user.findUnique({ where: { email } });

    if (user) {
      // --- EXISTING USER ---
      const memberships = await prisma.orgUser.findMany({
        where: { userId: user.id },
        include: { org: { select: { name: true, slug: true } } },
      });

      if (memberships.length === 1) {
        // Single org: issue full JWT immediately
        const token = await signToken({
          sub: user.id,
          orgId: memberships[0].orgId,
          role: memberships[0].role,
        });
        const params = new URLSearchParams({
          token,
          userId: user.id,
          email: user.email,
          name: user.name,
        });
        return NextResponse.redirect(`${origin}/auth/callback?${params.toString()}`);
      } else {
        // Multiple orgs: issue temp token for org selection
        const tempToken = await signToken({
          sub: user.id,
          orgId: '__pending__',
          role: 'MEMBER',
        });
        const membershipsParam = JSON.stringify(
          memberships.map((m) => ({
            orgId: m.orgId,
            role: m.role,
            orgName: m.org.name,
            orgSlug: m.org.slug,
          }))
        );
        const params = new URLSearchParams({
          tempToken,
          userId: user.id,
          email: user.email,
          name: user.name,
          memberships: membershipsParam,
        });
        return NextResponse.redirect(`${origin}/auth/callback?${params.toString()}`);
      }
    } else {
      // --- NEW USER: create User + Org + OrgUser ---
      const orgName = `${name}'s Workspace`;
      const baseSlug = orgName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      let orgSlug = baseSlug;
      let suffix = 0;
      while (await prisma.organization.findUnique({ where: { slug: orgSlug } })) {
        suffix++;
        orgSlug = `${baseSlug}-${suffix}`;
      }

      const result = await prisma.$transaction(async (tx) => {
        const newUser = await tx.user.create({
          data: { email, passwordHash: null, name },
        });
        const org = await tx.organization.create({
          data: { name: orgName, slug: orgSlug },
        });
        await tx.orgUser.create({
          data: { orgId: org.id, userId: newUser.id, role: 'OWNER' },
        });
        return { userId: newUser.id, orgId: org.id };
      });

      const token = await signToken({
        sub: result.userId,
        orgId: result.orgId,
        role: 'OWNER',
      });

      const params = new URLSearchParams({
        token,
        userId: result.userId,
        email,
        name,
      });
      return NextResponse.redirect(`${origin}/auth/callback?${params.toString()}`);
    }
  } catch (err) {
    console.error('[oauth callback] unexpected error:', err);
    return NextResponse.redirect(`${origin}/?error=oauth_failed`);
  }
}
