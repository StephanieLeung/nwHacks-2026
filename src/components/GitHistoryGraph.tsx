import React, { useEffect, useState } from "react";
import { Gitgraph, templateExtend, TemplateName } from "@gitgraph/react";

interface CommitInfo {
  hash: string;
  parents: string[];
  author: string;
  date: string;
  message: string;
}

export default function GitHistoryGraph() {
  const [commits, setCommits] = useState<CommitInfo[]>([]);

  useEffect(() => {
    window.API.git.getHistory().then((data: CommitInfo[]) => {
      setCommits(data);
    });
  }, []);

  if (!commits.length) return <p>Loading commit history...</p>;

  const template = templateExtend(TemplateName.Metro, {
    branch: {
      lineWidth: 2,
      spacing: 35, // tighter horizontal spacing
    },
    commit: {
      spacing: 20, // less vertical spacing between commits
      dot: { size: 4 },
      message: {
        display: false,
      },
    },
  });

  return (
    <div
    //   style={{
    //     maxHeight: "600px",     // ⬅ makes it shorter (adjust as needed)
    //     overflowY: "auto",      // ⬅ enables scrolling
    //     border: "1px solid #444",
    //     borderRadius: "6px",
    //     padding: "8px",
    //   }}
        className="h-full overflow-y-auto"
    >
      <Gitgraph options={{ template }}>
        {(gitgraph) => {
          const branchMap = new Map<string, any>();
          let master = gitgraph.branch("master");
          branchMap.set("master", master);

          commits.forEach((commit) => {
            const branch =
              branchMap.get(commit.hash) || branchMap.get("master");

            branch.commit({
              subject: commit.message,
              author: commit.author,
              hash: commit.hash,
            });

            if (commit.parents.length > 1) {
              commit.parents.slice(1).forEach((p) => {
                const parentBranch =
                  branchMap.get(p) || gitgraph.branch(p.slice(0, 6));
                parentBranch.commit();
                branch.merge(parentBranch);
              });
            }

            if (!branchMap.has(commit.hash)) {
              branchMap.set(commit.hash, branch);
            }
          });
        }}
      </Gitgraph>
    </div>
  );
}
