const {ChatGoogleGenerativeAI} = require('@langchain/google-genai');
const {StateGraph,MessagesAnnotation} = require('@langchain/langgraph');
const tools = require('./tool');
const {ToolMessage,AIMessage} = require('@langchain/core/messages');


const model = new ChatGoogleGenerativeAI({
    model:'gemini-2.5-flash',
    temperature:0.5
});


const graph = new StateGraph(MessagesAnnotation)
.addNode("tools",async(state,config)=>{ 
    // console.log(state);
    const lastMessage = state.messages[state.messages.length-1];

    const toolsCall = lastMessage.tool_calls;    

    const toolCallResults = await Promise.all(toolsCall.map(async(call)=>{
       const tool = tools[call.name];

       if(!tool){
        throw new Error(`Tool ${call.name} not found`);
       }
       const toolInput = call.args;
    //    console.log(call,config);
       

       const toolResult = await tool.func({...toolInput,token:config.metadata.token});
       console.log(toolResult);
       
       return new ToolMessage({content:toolResult,name:call.name});
    }));

    state.messages.push(...toolCallResults);
    return state;
})
.addNode('chat',async(state)=>{
  const response = await model.invoke(state.messages,{tools:[tools.searchProducts,tools.addProductToCart]});

   state.messages.push(new AIMessage({content:response.text,tool_calls:response.tool_calls}));
   return state;
})
.addEdge('__start__','chat')
.addConditionalEdges('chat',async(state)=>{
    const lastMessage = state.messages[state.messages.length-1];
    if(lastMessage.tool_calls && lastMessage.tool_calls.length > 0){
        return 'tools'
    }else{
        return '__end__'
    }
})
.addEdge('tools','chat')


const agent = graph.compile();

module.exports = agent;

