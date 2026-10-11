/**
 * Who is signed in, what plan they are on, and what they have left this month.
 * The auth listener itself lives once in src/routes/__root.tsx.
 */
import { useSyncExternalStore } from "react";

import { accountState, subscribeAccount } from "./accountState";
import { currentPlan } from "./plan";
import { allowanceLine, booksLeft, canCreatePage, canSaveBook, pagesLeft } from "./usage";

export function useAccount() {
  const state = useSyncExternalStore(subscribeAccount, accountState, accountState);
  return {
    signedIn: state.userId !== null,
    email: state.email,
    plan: currentPlan(),
    account: state,
    pagesLeft: pagesLeft(),
    booksLeft: booksLeft(),
    canCreatePage: canCreatePage(),
    canSaveBook: canSaveBook(),
    allowanceLine: allowanceLine(),
  };
}
