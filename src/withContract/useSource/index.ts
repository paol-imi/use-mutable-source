import * as client from './client';
import * as server from './server';
import { isServer } from '../../isServer';

export const [useSource, usePureSource, withContract] = !isServer
  ? [client.useSource, client.usePureSource, client.withContract]
  : [server.useSource, server.usePureSource, server.withContract];
