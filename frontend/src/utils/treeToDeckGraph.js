

export function treeToDeckGraph(root, {xGap = 200, yGap = 150} = {}) {

    if(!root) return{nodes:[],links:[]}

    let seq=0;
    const nodes=[]
    const links=[]
    

    function visit(node,parentId){
        const id = String(seq++);
        nodes.push({id,name:node?.name || "Unnamed",raw:node})

        if(parentId!=null){links.push({source:parentId,target:id})}
        (node?.children || []).forEach(child=>visit(child,id))
    }
    visit(root,null)


    const byId=new Map(nodes.map(n=>[n.id,{...n,children:[]}]))
    links.forEach(link=>byId.get(link.source).children.push(byId.get(link.target)))
    const treeRoot = byId.get("0")


    let nextX=0;
    function layout(node,depth){
        node.depth=depth;
        if(!node.children.length){
            node.x=nextX++ * xGap;
            node.y=depth*yGap;
            return;
        }
        node.children.forEach(c=> layout(c,depth+1))

        const xs = node.children.map(c=>c.x);
        node.x=(Math.min(...xs) + Math.max(...xs))/2
        node.y=depth*yGap;
    }
    layout(treeRoot,0);

    for (const n of nodes){
        const t = byId.get(n.id);
        n.pos=[t.y,t.x]
    }
    return{nodes,links}
}
