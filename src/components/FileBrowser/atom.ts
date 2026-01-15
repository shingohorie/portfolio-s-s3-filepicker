import { atom } from "jotai";

export const selectedFileAtom = atom<string>("");
export const searchWordAtom = atom<string>("");
export const frameIDAtom = atom<string>("");
export const isErrorAtom = atom<boolean>(false);
