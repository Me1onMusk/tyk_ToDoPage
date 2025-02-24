
'use client';

import { useState, useEffect } from "react";
import { DndContext, closestCenter, DragEndEvent } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove, horizontalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { loadBoards, saveBoards } from "../../lib/storage";
import { Board, Todo, HistoryState } from "../../lib/types"; // 타입 임포트 추가

// SortableTodo 컴포넌트 // 
// 하나의 Todo 아이템을 드래그 앤 드롭 가능하도록 만들어주는 컴포넌트입니다. 
function SortableTodo({
        todo,
        boardId,
        editTodo,
        deleteTodo,
    }: {
        todo: Todo;
        boardId: string;
        editTodo: (boardId: string, todoId: string, text: string) => void;
        deleteTodo: (boardId: string, todoId: string) => void;
    }) {

    // useSortable 훅을 통해 드래그 앤 드롭 동작에 필요한 속성과 함수를 가져옵니다.
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
      id: todo.id,
      data: { type: "todo", boardId },
    });

    // 드래그 앤 드롭 시 이동 및 애니메이션(transition)을 적용하기 위한 스타일
    const style = { transform: CSS.Transform.toString(transform), transition };
  
    return (
      <li
        ref={setNodeRef}
        style={style}
        className="p-2 bg-gray-50 rounded border flex justify-between items-center">
        {/* 드래그 핸들(드래그할 수 있는 영역) */}
        <div className="flex">
            <span {...attributes} {...listeners} className="cursor-move mr-2">☰</span>
            {/* Todo 내용이 바뀔 수 있으므로 input으로 구성 */}
            <input
                value={todo.text}
                onChange={(e) => editTodo(boardId, todo.id, e.target.value)}
                className="flex-1 bg-transparent border-none outline-none"/>
            {/* Todo 삭제 버튼 */}
            <button
                onClick={(e) => {
                    e.stopPropagation(); // 드래그 이벤트와 충돌 방지
                    deleteTodo(boardId, todo.id);
                }}
                className="text-red-500">
            <i className="fas fa-close" /> 
            </button>
        </div>
      </li>
    );
  };

// SortableBoard 컴포넌트 추가 // 
// 보드 자체를 드래그 앤 드롭할 수 있고, 내부의 Todos도 드래그 앤 드롭 가능한 컨테이너 컴포넌트입니다.
function SortableBoard({
        board,
        editBoard,
        deleteBoard,
        addTodo,
        editTodo,
        deleteTodo,
    }: {
        board: Board;
        editBoard: (id: string, newTitle: string) => void;
        deleteBoard: (id: string) => void;
        addTodo: (boardId: string, text: string) => void;
        editTodo: (boardId: string, todoId: string, text: string) => void;
        deleteTodo: (boardId: string, todoId: string) => void;
    }) {

    // useSortable 훅을 통해 보드를 드래그 앤 드롭할 수 있도록 설정
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
      id: board.id,
      data: { type: "board" },
    });

    // 드래그 앤 드롭 시 적용할 스타일
    const style = { transform: CSS.Transform.toString(transform), transition };
  
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="w-72 bg-white p-4 rounded shadow">
        {/* 보드 헤더 (보드 타이틀, 드래그 핸들, 삭제 버튼) */}
        <div className="flex justify-between items-center mb-2">
            <span {...attributes} {...listeners} className="cursor-move mr-2">☰</span>
            {/* 보드 제목 수정 */}
            <input
                value={board.title}
                onChange={(e) => editBoard(board.id, e.target.value)}
                className="text-lg font-semibold w-full bg-transparent border-none outline-none"/>
            {/* 보드 삭제 버튼 */}
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    deleteBoard(board.id);
                }}
                className="text-red-500">
                <i className="fas fa-close" /> 
            </button>
        </div>

        {/* 보드 내의 Todo 리스트를 드래그 앤 드롭 가능하도록 SortableContext로 감싼다 */}
        <SortableContext items={board.todos.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          <ul className="space-y-2 min-h-[20px]">
            {board.todos.map((todo) => (
                <SortableTodo
                    key={todo.id}
                    todo={{ ...todo, boardId: board.id }}
                    boardId={board.id}
                    editTodo={editTodo}
                    deleteTodo={deleteTodo} />
            ))}
          </ul>
        </SortableContext>

        {/* 새 Todo 추가 인풋 */}
        <div className="flex items-center justify-center mt-5">
            <input
                placeholder="할 일 추가"
                onKeyDown={(e) => {
                    if (e.key === "Enter" && e.currentTarget.value.trim()) {
                        addTodo(board.id, e.currentTarget.value);
                        e.currentTarget.value = "";
                    }
                }}
                className="p-2 border w-full"/>
            <button 
                className="bg-light-blue-500 justify-center items-center p-2 text-white rounded-sm"
                onClick={(e) => {
                    const input = e.currentTarget.previousSibling as HTMLInputElement;
                    if (input.value.trim()) {
                      addTodo(board.id, input.value);
                      input.value = "";
                    }
                  }}>
                <i className="fas fa-plus" /> 
            </button>
        </div>
      </div>
    );
};

// 메인 컴포넌트(HomePage)
// 모든 로직을 관리하고, 보드들을 렌더링하며 DnDContext를 제공하는 최상위 컴포넌트입니다.
export default function HomePage() {

    const [ boards, setBoards ] = useState<Board[]>(loadBoards());  //보드 상태 관리 (LocalStorage로부터 로드)
    const [ history, setHistory ] = useState<HistoryState>({ past: [], present: boards, future: [] });    //Undo/Redo 기능을 위한 HistoryState
    const [ newBoardTitle, setNewBoardTitle ] = useState("");  //새로 추가할 보드의 제목 상태

    useEffect(() => saveBoards(boards), [boards]);    //보드 변경이 있을 때마다 LocalStorage에 저장

    // 보드 추가 함수 //
    const addBoard = () => {
        if (!newBoardTitle.trim()) return;  //제목에 공백만 있으면 무시
        const newBoard: Board = {
          id: crypto.randomUUID(),  //고유 식별자
          title: newBoardTitle,
          todos: [],
          createdAt: new Date().toISOString(),
        };
        const newBoards = [...boards, newBoard];  //기존 보드 목록에 새 보드를 추가

         //히스토리에 현재 상태를 '과거'로 저장하고, 새 상태를 '현재'로 업데이트 
        setHistory({ past: [...history.past, boards], present: newBoards, future: [] });
        setBoards(newBoards);
        setNewBoardTitle("");
    };

    // 보드 수정 함수 //
    const editBoard = (id: string, newTitle: string) => {
        const newBoards = boards.map((b) => (b.id === id ? { ...b, title: newTitle } : b));  //해당 id의 보드 타이틀을 변경
        setHistory({ past: [...history.past, boards], present: newBoards, future: [] });
        setBoards(newBoards);
    };

    // 보드 삭제 함수 //
    const deleteBoard = (id: string) => {
        const newBoards = boards.filter((b) => b.id !== id);
        setHistory({ past: [...history.past, boards], present: newBoards, future: [] });
        setBoards(newBoards);
    };

    // Todo 추가 함수 //
    const addTodo = (boardId: string, text: string) => {
        const newBoards = boards.map((b) =>
          b.id === boardId
            ? { ...b, todos: [...b.todos, { id: crypto.randomUUID(), text, boardId, createdAt: new Date().toISOString() }] }
            : b
        );
        setHistory({ past: [...history.past, boards], present: newBoards, future: [] });
        setBoards(newBoards);
    };

    // Todo 삭제 함수 // 
    const deleteTodo = (boardId: string, todoId: string) => {
        const newBoards = boards.map((b) =>
          b.id === boardId ? { ...b, todos: b.todos.filter((t) => t.id !== todoId) } : b
        );
        setHistory({ past: [...history.past, boards], present: newBoards, future: [] });
        setBoards(newBoards);
    };

    // Todo 수정 함수 //
    const editTodo = (boardId: string, todoId: string, newText: string) => {
        const newBoards = boards.map((b) =>
          b.id === boardId
            ? { ...b, todos: b.todos.map((t) => (t.id === todoId ? { ...t, text: newText } : t)) }
            : b
        );
        setHistory({ past: [...history.past, boards], present: newBoards, future: [] });
        setBoards(newBoards);
    };

    // 드래그 앤 드롭 종료 시의 이벤트 처리 // 
    const onDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;  //목표가 없거나(드롭되지 않은 경우) 같은 위치로 드래그했다면 처리 중단

        // 드래그 대상(active)과 드롭 대상(over)의 타입을 확인 ("board" | "todo")
        const activeType = active.data.current?.type;
        const overType = over.data.current?.type;

        const newBoards = [...boards];

        // 보드 자체를 드래그하는 경우 (보드를 재정렬)
        if (activeType === "board" && overType === "board") {
            const oldIndex = newBoards.findIndex((b) => b.id === active.id);  //현재 순서에서의 인덱스를 찾고
            const newIndex = newBoards.findIndex((b) => b.id === over.id);    //드롭 위치의 인덱스를 찾는다
            const reorderedBoards = arrayMove(newBoards, oldIndex, newIndex);  //arrayMove를 이용해 인덱스 위치를 바꿔준다

            // 히스토리에 적용 후 상태 업데이트 
            setHistory({ past: [...history.past, boards], present: reorderedBoards, future: [] });
            setBoards(reorderedBoards);
            return;
        }
      
        // Todo를 드래그하는 경우
        // active.id는 드래그 중인 Todo의 id
        const todoId = active.id.toString();
        const sourceBoardId = active.data.current?.boardId as string;  //소스 보드 id
        // 목적지 보드 id (over가 Todo라면 그 Todo가 속한 보드, 보드 영역이라면 보드 id, 둘 다 아니면 소스 보드 id)
        const destBoardId = (over.data.current?.boardId || boards.find((b) => b.todos.some((t) => t.id === over.id.toString()))?.id || sourceBoardId) as string;
        
        // 소스 보드와 목적지 보드를 찾는다
        const sourceBoard = newBoards.find((b) => b.id === sourceBoardId);
        const destBoard = newBoards.find((b) => b.id === destBoardId);
      
        if (!sourceBoard || !destBoard) return;
      
        // 소스 보드에서 Todo의 인덱스를 찾는다
        const todoIndex = sourceBoard.todos.findIndex((t) => t.id === todoId);
        if (todoIndex === -1) return;  
      
        const [ movedTodo ] = sourceBoard.todos.splice(todoIndex, 1);   //소스 보드에서 해당 Todo를 제거
      
        // 같은 보드 내 이동인 경우
        if (sourceBoardId === destBoardId) {
            const overIndex = destBoard.todos.findIndex((t) => t.id === over.id.toString());  //목적지 Todo 인덱스 파악
            let insertIndex;
            if (overIndex === -1) 
                insertIndex = destBoard.todos.length;  //만약 그 위치를 못 찾으면 마지막에 삽입
            else
                insertIndex = todoIndex < overIndex ? overIndex : overIndex;  //위에서 이미 Todo를 뺐기 때문에, 이동이 위쪽에서 아래쪽으로인 경우 계산이 달라질 수 있습니다
          destBoard.todos.splice(insertIndex, 0, movedTodo);                  //목적지 보드의 해당 위치에 Todo 삽입
        } else {
          const overIndex = destBoard.todos.findIndex((t) => t.id === over.id.toString());  //다른 보드로 이동하는 경우
          const insertIndex = overIndex >= 0 ? overIndex + 1 : destBoard.todos.length;      //정확한 위치를 찾을 수 있으면 그 위치 다음에, 없으면 맨 뒤에
          destBoard.todos.splice(insertIndex, 0, { ...movedTodo, boardId: destBoardId });   //Todo의 boardId를 목적지 보드로 교체
        }
      
        // 히스토리에 저장하고 상태 업데이트
        setHistory({ past: [...history.past, boards], present: newBoards, future: [] });
        setBoards(newBoards);
      };

    // Undo 기능
    const undo = () => {
        if (history.past.length === 0) return;  // 되돌릴 과거 상태가 없다면 함수 종료

        // 과거에서 마지막 항목을 현재로 만들고, 현재 상태를 future에 추가
        const newPast = history.past.slice(0, -1);
        const newPresent = history.past[history.past.length - 1];
        const newFuture = [boards, ...history.future];

        setHistory({ past: newPast, present: newPresent, future: newFuture });
        setBoards(newPresent);
    };

    // Redo 기능
    const redo = () => {
        if (history.future.length === 0) return;  // future에 상태가 없다면 함수 종료

        // future의 첫 번째 항목을 현재로 만들고, 현재 상태를 past에 추가
        const newPast = [...history.past, boards];
        const newPresent = history.future[0];
        const newFuture = history.future.slice(1);

        setHistory({ past: newPast, present: newPresent, future: newFuture });
        setBoards(newPresent);
    };

    return (
        <div className="min-h-screen bg-gray-100 p-6">
            <div className="max-w-6xl mx-auto">
                {/* 페이지 타이틀 */}
                <h1 className="text-3xl font-bold mb-6">To-Do Boards</h1>

                {/* 새로운 보드 추가 섹션 + Undo/Redo 버튼 */}
                <div className="flex gap-2 mb-6">
                    <input
                        value={ newBoardTitle }
                        onChange={(e) => setNewBoardTitle(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" && e.currentTarget.value.trim()) {
                                addBoard();
                                e.currentTarget.value = "";
                            }
                        }}
                        placeholder="새 보드 이름"
                        className="flex-1 p-2 border rounded" />
                    <button onClick={ addBoard } className="p-2 bg-blue-500 text-white rounded">보드 추가</button>
                    <button
                        onClick={ undo }
                        disabled={ history.past.length === 0 }
                        className="p-2 bg-gray-500 text-white rounded disabled:bg-gray-300">
                        Undo
                    </button>
                    <button
                        onClick={ redo }
                        disabled={ history.future.length === 0 }
                        className="p-2 bg-gray-500 text-white rounded disabled:bg-gray-300">
                        Redo
                    </button>
                </div>

                {/* DnDContext를 사용해 보드들을 드래그 앤 드롭 가능하게 함 */}
                {/* 각 보드를 SortableBoard로 감싸서 드래그 앤 드롭 및 Todo 추가/수정/삭제를 처리 */}
                <DndContext collisionDetection={closestCenter} onDragEnd={onDragEnd}>
                    <SortableContext items={boards.map((b) => b.id)} strategy={horizontalListSortingStrategy}>
                    <div className="flex gap-4 overflow-x-auto">
                        {boards.map((board) => (
                            <SortableBoard
                                key={board.id}
                                board={board}
                                editBoard={editBoard}
                                deleteBoard={deleteBoard}
                                addTodo={addTodo}
                                editTodo={editTodo}
                                deleteTodo={deleteTodo}/>
                        ))}
                    </div>
                    </SortableContext>
                </DndContext>

            </div>
        </div>
    );
};