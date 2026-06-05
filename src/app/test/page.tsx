"use client";
import React, { useState } from "react";

const Page = () => {
  const [serach, setSearch] = useState("");
  const [serachValue, setSearchValue] = useState([]);
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
  };
  const handleAdd = () => {
    setSearchValue([...serachValue, serach as never]);
  };
  return (
    <div>
      <div className="flex flex-col gap-2 justify-between align-center">
        <input type="text" onChange={handleSearch} />
        <button onClick={() => handleAdd()}>add</button>
        <div className="w-screen h-screen query-2xl">
          <h1>
            {serachValue.map((item: any) => (
              <div key={item}>{item}</div>
            ))}
          </h1>
          <div>
            <input
              type="text"
              placeholder="search value "
              onChange={handleSearch}
            />
          </div>
          <div>
            <button>delete</button>
          </div>
        </div>
        <div>
          <input type="text" placeholder="search value" />

        </div>
      </div>
    </div>
  );
};

export default Page;
