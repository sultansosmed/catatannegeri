import { Role } from "@prisma/client";

export function canPublish(role: Role): boolean {
  return role === Role.SUPER_ADMIN || role === Role.EDITOR;
}

export function canManageUsers(role: Role): boolean {
  return role === Role.SUPER_ADMIN;
}

export function canManageSettings(role: Role): boolean {
  return role === Role.SUPER_ADMIN;
}

export function canManageCategories(role: Role): boolean {
  return role === Role.SUPER_ADMIN || role === Role.EDITOR;
}

export function canEditArticle(role: Role, articleAuthorUserId: string, currentUserId: string): boolean {
  if (role === Role.SUPER_ADMIN || role === Role.EDITOR) {
    return true;
  }
  if (role === Role.AUTHOR && articleAuthorUserId === currentUserId) {
    return true;
  }
  return false;
}

export function canDeleteArticle(role: Role): boolean {
  return role === Role.SUPER_ADMIN || role === Role.EDITOR;
}

export function canManageRedirects(role: Role): boolean {
  return role === Role.SUPER_ADMIN || role === Role.EDITOR;
}

export function canManageIntegrations(role: Role): boolean {
  return role === Role.SUPER_ADMIN;
}

