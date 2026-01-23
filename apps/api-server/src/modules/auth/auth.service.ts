import { db, users, userProfiles, roles, userRoles } from '@quiz/db';
import { eq } from 'drizzle-orm';
import { PasswordService } from './password.service';
import { TokenService } from './token.service';

export class AuthService {
  static async signup(email: string, password: string, name: string) {
    // 1. Check if user exists
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (existingUser) {
      throw new Error('User already exists');
    }

    // 2. Hash password
    const passwordHash = await PasswordService.hash(password);

    // 3. Create user
    return await db.transaction(async (tx) => {
      const [newUser] = await tx.insert(users).values({
        email,
        passwordHash,
      }).returning();

      await tx.insert(userProfiles).values({
        userId: newUser.id,
        name,
      });

      // Assign default USER role (Assumes role exists)
      const userRole = await tx.query.roles.findFirst({
        where: eq(roles.name, 'USER'),
      });

      if (userRole) {
        await tx.insert(userRoles).values({
          userId: newUser.id,
          roleId: userRole.id,
        });
      }

      return newUser;
    });
  }

  static async login(email: string, password: string) {
    const user = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (!user || !(await PasswordService.compare(password, user.passwordHash))) {
      throw new Error('Invalid credentials');
    }

    // Get roles
    const userRolesList = await db.query.userRoles.findMany({
      where: eq(userRoles.userId, user.id),
      with: {
        role: true,
      }
    });

    const roleNames = userRolesList.map(ur => ur.role.name);

    const accessToken = TokenService.generateAccessToken({
      userId: user.id,
      email: user.email,
      roles: roleNames,
    });

    const refreshToken = TokenService.generateRefreshToken(user.id);

    return { user, accessToken, refreshToken };
  }
}
