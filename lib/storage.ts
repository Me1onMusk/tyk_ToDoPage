
import { Board } from "./types";

export const loadBoards = (): Board[] => {
    const data = localStorage.getItem("boards");
    return data ? JSON.parse(data) : [];
  };
  
  export const saveBoards = (boards: Board[]) => {
    localStorage.setItem("boards", JSON.stringify(boards));
  };