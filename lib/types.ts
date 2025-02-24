
export type Todo = {
    id: string;
    text: string;
    boardId: string;
    createdAt: string;
};
  
export type Board = {
    id: string;
    title: string;
    todos: Todo[];
    createdAt: string;
};
  
export type HistoryState = {
    past: Board[][];
    present: Board[];
    future: Board[][];
};