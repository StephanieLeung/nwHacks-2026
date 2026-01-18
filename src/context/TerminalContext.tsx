import React, { createContext, useContext, useState, ReactNode } from "react";

type TerminalContextType = {
  command: string;
  setCommand: (command: string) => void;
};

const TerminalContext = createContext<TerminalContextType | undefined>(undefined);

export const TerminalProvider = ({ children }: { children: ReactNode }) => {
  const [command, setCommand] = useState<string>("");

  return (
    <TerminalContext.Provider value={{ command, setCommand }}>
      {children}
    </TerminalContext.Provider>
  );
};

export const useTerminal = () => {
  const context = useContext(TerminalContext);
  if (!context) {
    throw new Error("useTerminal must be used within a TerminalProvider");
  }
  return context;
};
