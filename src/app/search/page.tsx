
"use client";

import Head from "next/head";
import { useState } from "react";
import { useDebounce } from "use-debounce";
import { loadBoards } from "../../../lib/storage";
import { Board } from "../../../lib/types";

export default function SearchPage() {

    const [ query, setQuery ] = useState("");  //검색어 상태
    const [ debouncedQuery ] = useDebounce(query, 300);    //입력값에 debounce를 적용해 300ms간 변화를 지켜본 후 실제로 사용
    const boards: Board[] = loadBoards();    //저장된 보드 정보 로드
  
      // 보드 목록 중에서 보드 제목이나 할 일(todo) 텍스트에 검색어가 포함되어 있는지 필터링 //
    const filteredBoards = boards.filter(
      (board) =>
        board.title.toLowerCase().includes(debouncedQuery.toLowerCase()) ||
        board.todos.some((todo) => todo.text.toLowerCase().includes(debouncedQuery.toLowerCase()))
    );
  
    return (
    <>
        <div className="min-h-screen bg-gray-100 p-6">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold mb-6">검색</h1>
                
                {/* 검색어 입력 필드 */}
                <div className="flex justify-center items-center mb-6">
                    <input
                        value={ query }
                        onChange={ (e) => setQuery(e.target.value) }
                        placeholder="보드 또는 할 일 검색"
                        className="w-full p-2 border rounded" />
                    <i className="fas fa-search" /> 
                </div>
                
                {/* 필터링된 보드 목록을 출력 */}
                <div className="space-y-4">
                    {filteredBoards.map((board) => (
                    <div key={board.id} className="bg-white p-4 rounded shadow">
                        <h2 className="text-lg font-semibold">{board.title}</h2>
                        {/* 해당 보드 안에 검색어와 일치하는 할 일 목록 출력 */}
                        <ul className="mt-2 space-y-2">
                        {board.todos
                            .filter((todo) => todo.text.toLowerCase().includes(debouncedQuery.toLowerCase()))
                            .map((todo) => (
                            <li key={todo.id} className="p-2 bg-gray-50 rounded">{todo.text}</li>
                            ))}
                        </ul>
                    </div>
                    ))}
                </div>
                
            </div>
        </div>
    </>
    );
};