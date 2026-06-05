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
      <div>
        <input type="text" onChange={handleSearch} />
        <button onClick={() => handleAdd()}>add</button>
        <div>
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
      </div>
    </div>
  );
};

export default Page;
