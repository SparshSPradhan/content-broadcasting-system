import { Role } from '@prisma/client';
import { prisma } from '../../lib/prisma';

export class UserService {
  async getAllTeachers() {
    return prisma.user.findMany({
      where: { role: Role.teacher },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    });
  }

  async getUserById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    });
  }
}