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
      lineWidth: 3,
      spacing: 50,
    },
    commit: {
      spacing: 30,
      dot: {
        size: 5,
      },
      message: {
        display: false,
        displayAuthor: false,
        displayHash: false,
      },
    },
  });

    return (
        <Gitgraph options={{ template }}>
            {(gitgraph) => {
            const branchMap = new Map<string, any>();
            let master = gitgraph.branch("master");
            branchMap.set("master", master);

            // Simple heuristic: treat parent[0] chain as master
            commits.forEach((commit) => {
                const parent = commit.parents[0];
                const branch = branchMap.get(commit.hash) || branchMap.get("master");

                const gCommit = branch.commit({
                subject: commit.message,
                author: commit.author,
                hash: commit.hash,
                });

                // If merge commit: call merge()
                if (commit.parents.length > 1) {
                commit.parents.slice(1).forEach((p) => {
                    const parentBranch =
                    branchMap.get(p) || gitgraph.branch(p.slice(0, 6));
                    parentBranch.commit();
                    branch.merge(parentBranch);
                });
                }

                // Keep branch map in sync
                if (!branchMap.has(commit.hash)) {
                branchMap.set(commit.hash, branch);
                }
            });
            }}
        </Gitgraph>
        );
    }

  