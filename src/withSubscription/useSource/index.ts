import * as client from './client';
import * as server from './server';
import { isServer } from '../../isServer';

export const [useSource, usePureSource] = !isServer
  ? [client.useSource, client.usePureSource]
  : [server.useSource, server.usePureSource];
