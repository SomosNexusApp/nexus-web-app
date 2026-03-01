import { Actor } from './actor.model';

export interface Admin extends Actor {
  nivelAcceso: number;
}
