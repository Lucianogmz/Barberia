'use client';

import { createContext, useContext } from 'react';

export const TokenContext = createContext<string | null>(null);

export const useApiToken = () => useContext(TokenContext);
