import crypto from 'node:crypto';
import debug from 'debug';

import DatabaseProvider, { DatabaseError } from './repositories/database';
import { hashPassword, isPasswordStrong } from '~/server/utils/password';
import { Lang } from './repositories/types';
import SYSTEM from './repositories/system';

import type { User } from './repositories/user/model';
import type { ID } from './repositories/types';

const DEBUG = debug('InMemoryDB');

// In-Memory Database Provider
export default class InMemory extends DatabaseProvider {
  async connect() {
    this.data.system = SYSTEM;
    DEBUG('Connection done');
  }

  async disconnect() {
    this.data = { system: null, users: [] };
    DEBUG('Diconnect done');
  }

  async getSystem() {
    DEBUG('Get System');
    return this.data.system;
  }

  async getLang() {
    return this.data.system?.lang || Lang.EN;
  }

  async getUsers() {
    return this.data.users;
  }

  async getUser(id: ID) {
    DEBUG('Get User');
    return this.data.users.find((user) => user.id === id);
  }

  async newUserWithPassword(username: string, password: string) {
    DEBUG('New User');

    if (username.length < 8) {
      throw new DatabaseError(DatabaseError.ERROR_USERNAME_REQ);
    }

    if (!isPasswordStrong(password)) {
      throw new DatabaseError(DatabaseError.ERROR_PASSWORD_REQ);
    }

    const isUserExist = this.data.users.find(
      (user) => user.username === username
    );
    if (isUserExist) {
      throw new DatabaseError(DatabaseError.ERROR_USER_EXIST);
    }

    const now = new Date();
    const isUserEmpty = this.data.users.length === 0;

    const newUser: User = {
      id: crypto.randomUUID(),
      password: hashPassword(password),
      username,
      role: isUserEmpty ? 'ADMIN' : 'CLIENT',
      enabled: true,
      createdAt: now,
      updatedAt: now,
    };

    this.data.users.push(newUser);
  }

  async updateUser(user: User) {
    let _user = await this.getUser(user.id);
    if (_user) {
      DEBUG('Update User');
      _user = user;
    }
  }

  async deleteUser(id: ID) {
    DEBUG('Delete User');
    const idx = this.data.users.findIndex((user) => user.id === id);
    if (idx !== -1) {
      this.data.users.splice(idx, 1);
    }
  }
}