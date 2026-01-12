import { Module } from '../modules/module.interface';

export interface UserInterface {
  id: string;
  email: string;
  name: string;
  favoriteModules: string[];
}
