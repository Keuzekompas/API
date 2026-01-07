import { Module } from '../modules/module.interface';

export interface UserInterface {
  id: string;
  studentNumber: number;
  email: string;
  name: string;
  favoriteModules: string[] | Module[];
}
