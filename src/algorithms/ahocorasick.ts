
interface AhoNode {
    children: Map<string, number>; // map karakter -> idx node anak
    fail: number;
    output: string[];
}

function createNode(): AhoNode {
    return {
        children: new Map(),
        fail: 0,
        output: [],
    };
}

function buildAutomaton(patterns: string[]): AhoNode[] {
    const nodes: AhoNode[] = [createNode()];

    for (const pat of patterns) {
        let cur = 0;
        for (const ch of pat) {
            if (!nodes[cur].children.has(ch)) {
                nodes[cur].children.set(ch, nodes.length);
                nodes.push(createNode());
            }
            cur = nodes[cur].children.get(ch)!;
        }
        nodes[cur].output.push(pat);
    }

    const queue: number[] = [];

    for (const [, childIdx] of nodes[0].children) {
        nodes[childIdx].fail = 0; 
        queue.push(childIdx);
    }

    while (queue.length > 0) {
        const cur = queue.shift()!;

        for (const [ch, childIdx] of nodes[cur].children) {
            let fail = nodes[cur].fail;

            while (fail !== 0 && !nodes[fail].children.has(ch)) {
                fail = nodes[fail].fail;
            }

            if (nodes[fail].children.has(ch) && nodes[fail].children.get(ch) !== childIdx) {
                nodes[childIdx].fail = nodes[fail].children.get(ch)!;
            } else {
                nodes[childIdx].fail = 0;
            }

            nodes[childIdx].output = [
                ...nodes[childIdx].output,
                ...nodes[nodes[childIdx].fail].output,
            ];

            queue.push(childIdx);
        }
    }

    return nodes;
}

export interface AhoCorasickResult {
    positions: number[];   
    comparisons: number;   
}

export function ahoCorasickSearch(
    text: string,
    patterns: string[]
): Map<string, AhoCorasickResult> {
    const result = new Map<string, AhoCorasickResult>();

    for (const pat of patterns) {
        result.set(pat, { positions: [], comparisons: 0 });
    }

    if (patterns.length === 0 || text.length === 0) return result;

    const nodes = buildAutomaton(patterns);
    let comparisons = 0;
    let cur = 0; 

    for (let i = 0; i < text.length; i++) {
        const ch = text[i];
        comparisons++;

        while (cur !== 0 && !nodes[cur].children.has(ch)) {
            cur = nodes[cur].fail;
        }

        if (nodes[cur].children.has(ch)) {
            cur = nodes[cur].children.get(ch)!;
        }

        for (const matched of nodes[cur].output) {
            const startPos = i - matched.length + 1;
            result.get(matched)!.positions.push(startPos);
        }
    }

    for (const pat of patterns) {
        result.get(pat)!.comparisons = comparisons;
    }

    return result;
}