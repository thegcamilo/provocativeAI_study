import './App.css';
import { Component } from 'react';

class App extends Component {
  constructor(props) {
    super(props);

    // const urlSearchString = window.location.search;
    // const params = new URLSearchParams(urlSearchString);

    this.state = {
      stages: ["idea", "eval", "llm", "end"],
      currStage: 0,
      ideaNumber: 0,
      ideas: [],
      responses: [{creativity: null, potential: null}],
      llmResponses: [], // To store LLM feedback
      isProcessing: false, // To handle loading/spinner state
      time: {
        init: new Date()
      },
      LUCIDBackendURL: "https://test-lucid.vercel.app/lucid", // Replace with your actual URL,
      selectedPromptType: "Provocative",
      systemPrompt: PROMPT_TEMPLATES["Provocative"],
      // uniqueId: "u" + Math.floor(Math.random()*100 * Date.now()).toString(36),
      // prolificId: (params.has("PROLIFIC_PID") ? params.get("PROLIFIC_PID") : (Math.random() + 1).toString(36).substring(7)),
      // // studyId: params.get("STUDY_ID"),
      // // sessionID: params.get("SESSION_ID"),
    }

    this.saveResponse = this.saveResponse.bind(this);
    this.saveTime = this.saveTime.bind(this);
    this.saveIdea = this.saveIdea.bind(this);
    this.skipStage = this.skipStage.bind(this);
    this.sendToLLM = this.sendToLLM.bind(this);
    this.redirectToSurveyCompletion = this.redirectToSurveyCompletion.bind(this);
    this.handlePromptChange = this.handlePromptChange.bind(this);
  }

  async sendToLLM() {
    const { ideaNumber, ideas, systemPrompt, LUCIDBackendURL, llmResponses } = this.state;
    const currentUserIdea = ideas[ideaNumber];

    this.setState({ isProcessing: true });

    const payload = {
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: currentUserIdea }
      ]
    };

    const updatedLlmResponses = [...llmResponses];
    updatedLlmResponses[ideaNumber] = "test to not spend money";

    // this.setState({ 
    //     llmResponses: updatedLlmResponses, 
    //     isProcessing: false 
    //   });

    try {
      const response = await fetch(LUCIDBackendURL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error("Network response was not ok");

      const data = await response.json();
      const generatedText = data.generated_text || "Error: No response text received.";

      const updatedLlmResponses = [...llmResponses];
      updatedLlmResponses[ideaNumber] = generatedText;

      this.setState({ 
        llmResponses: updatedLlmResponses, 
        isProcessing: false 
      });

    } catch (error) {
      console.error("LLM Request Error:", error);
      const updatedLlmResponses = [...llmResponses];
      updatedLlmResponses[ideaNumber] = "Sorry, there was an error connecting to the AI service.";
      alert("There was an error. Please, contact the study administrators");
      
      this.setState({ 
        llmResponses: updatedLlmResponses, 
        isProcessing: false 
      });
    }
  }

  redirectToSurveyCompletion() {
    // let path = 'https://app.prolific.com/submissions/complete?cc=CO2SRWLN';
    // let path = "https://mpisws.eu.qualtrics.com/jfe/form/SV_6Wh4Iz782dXDsvc?prolificId=" + 
    // this.state.prolificId + "&uniqueId=" + this.state.uniqueId + "&study=" + this.state.study;
    // window.open(path, "_self");
  }

  handlePromptChange(e) {
    const type = e.target.value;
    this.setState({
      selectedPromptType: type,
      systemPrompt: PROMPT_TEMPLATES[type]
    });
  }

  skipStage() {
    var currStage = this.state.stages[this.state.currStage];
    console.log("Current Stage" + currStage);
    if (currStage === "idea") {
        this.sendToLLM();
    } else if (currStage === "eval") {
      console.log("to do");
    } else if (currStage === "llm") {
    var payload = JSON.stringify(this.state.ideas);
    console.log("sending msg from React");
    console.log(payload);
        window.parent.postMessage(
          {
            type: 'STUDY_DATA',
            payload: payload
          },
          '*'
        )
    }

    if (currStage === "llm") {
      this.setState({currStage: 0});
    } else {
      this.setState({currStage: this.state.currStage + 1});
    }
    
    window.scrollTo(0, 0);
  }

  saveIdea(v) {
    var ideaNumber = this.state.ideaNumber;
    var ideas = this.state.ideas;
    ideas[ideaNumber] = v;
    this.setState({ideas: ideas});
  }

  savePrompt(v) {
    this.setState({systemPrompt: v});
  }

  saveResponse(question, answer) {
    var currResponses = this.state.responses;
    if (!currResponses[this.state.ideaNumber]) {
    currResponses[this.state.ideaNumber] = {
      creativity: null,
      potential: null
      };
    }
    currResponses[this.state.ideaNumber][question] = answer;
    this.setState({responses: currResponses});
  }

  saveTime(nameTime) {
    const delta_time = new Date() - this.state.time["init"];
    this.setState({time: {...this.state.time, [nameTime]: delta_time}});
  }

  renderScale(questionId, leftAnchor, rightAnchor) {
    return (
      <div className="scale-row">
        <div className="scale-anchor anchor-left">{leftAnchor}</div>
        <div className="scale-options-group">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <label key={num} className="scale-unit">
              <input 
                type="radio" 
                name={questionId} 
                value={num}
                // Check against the current ideaNumber in the responses array
                checked={this.state.responses[this.state.ideaNumber]?.[questionId] === num.toString()}
                onChange={(e) => this.saveResponse(questionId, e.target.value)}
              />
              <span>{num}</span>
            </label>
          ))}
        </div>
        <div className="scale-anchor anchor-right">{rightAnchor}</div>
      </div>
    );
  }

  render() {
    const currStageName = this.state.stages[this.state.currStage];
    let content;

    if (currStageName === "idea") {
      content = (
        <div className="stage-container" style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
          {/* <h2>Stage 1: Idea Generation</h2> */}
          <div style={{ textAlign: 'left', marginBottom: '20px' }}>
            <strong>Instructions:</strong> This is the test interface for the study on Provocative AI. 
            Your movie idea should be a minimum of 50 characters.
            You may edit the prompt below however you'd like.
          </div>
          <div><strong>Prompt (Editable)</strong></div>
          <div style={{ marginTop: '0px' }}>
          {["Provocative", "Sycophantic", "Antagonistic", "Full Idea"].map((type) => (
            <label key={type} style={{ marginRight: '15px', cursor: 'pointer' }}>
              <input
                type="radio"
                value={type}
                checked={this.state.selectedPromptType === type}
                onChange={this.handlePromptChange}
                style={{ marginRight: '5px' }}
              />
              {type}
            </label>
          ))}
        </div>
          <textarea 
            style={{ width: '100%', height: '300px', padding: '10px', fontSize: '16px',
              fontFamily: 'inherit'
             }}
            value={this.state.systemPrompt || ""}
            onChange={(e) => this.savePrompt(e.target.value)}
          />
          <div><strong>Idea</strong></div>
          <textarea 
            style={{ width: '100%', height: '100px', padding: '10px', fontSize: '16px',
              fontFamily: 'inherit'
             }}
            placeholder="Type your idea here..."
            value={this.state.ideas[this.state.ideaNumber] || ""}
            onChange={(e) => this.saveIdea(e.target.value)}
          />
          
          <div style={{ marginTop: '20px' }}>
            <button 
              className="btn-primary"
              onClick={this.skipStage}
              disabled={(this.state.ideas[this.state.ideaNumber]?.length || 0) < 50} // Optional: Disable if empty
              style={{padding: '10px 20px', cursor: 'pointer'}}
            >
              Submit Idea
            </button>
          </div>
        </div>
      );
    } else if (currStageName === "eval") {
    const currentIdea = this.state.ideas[this.state.ideaNumber];
    const currentResp = this.state.responses[this.state.ideaNumber] || {};
    
    content = (
        <div className="stage-container" style={{ textAlign: 'center' }}>
          <h3>You came up with the following idea:</h3>
          <div className="idea-display">
            "{currentIdea}"
          </div>

          <div className="eval-question-container">
            <p><strong>Novelty Question</strong></p>
            {this.renderScale("creativity", "Not novel at all", "Extremely novel")}
          </div>

          <div className="eval-question-container">
            <p><strong>Usefulness question</strong></p>
            {this.renderScale("potential", "Not useful at all", "Extremely useful")}
          </div>

          <div style={{ marginTop: '40px' }}>
            <button 
              className="btn-primary" 
              onClick={this.skipStage}
              disabled={!currentResp.creativity || !currentResp.potential}
            >
              Next
            </button>
          </div>
        </div>
      );
    } else if (currStageName === "llm") {
      const llmFeedback = this.state.llmResponses[this.state.ideaNumber];
      const currentIdea = this.state.ideas[this.state.ideaNumber];
      
      content = (
        <div className="stage-container" style={{ textAlign: 'center', maxWidth: '800px', margin: '0 auto' }}>
          <h3>Your Idea:</h3>
          <div className="idea-display">
            "{currentIdea}"
          </div>

          <h3>An AI system gave you the following suggestion:</h3>
          
          {this.state.isProcessing ? (
            <div className="loading-container">
              <p>The AI system is analyzing your idea...</p>
              <div className="circular-spinner"></div>
            </div>
          ) : (
            <div className="ai-response-box" style={{ 
                padding: '20px', 
                backgroundColor: '#f9f9f9', 
                border: '1px solid #ddd', 
                borderRadius: '8px',
                textAlign: 'left',
                whiteSpace: 'pre-wrap'
            }}>
              {llmFeedback}
            </div>
          )}

          <div style={{ marginTop: '30px' }}>
             <button className="btn-primary" onClick={this.skipStage} disabled={this.state.isProcessing}>
               Go Back
             </button>
          </div>
        </div>
      );
    } else {
      content = <div>React Done!</div>
    }
    return (
      <div className='App'>{content}</div>
    )
  }
}

export default App;

const PROMPT_TEMPLATES = {
  "Full Idea": `IGNORE ALL PREVIOUS INSTRUCTIONS.

Background
- You are assisting a participant in an incentivized creativity competition.  
- The participant is brainstorming a movie idea that will be judged by third‑party evaluators on two dimensions of creativity:
1. Novelty: how novel the idea is.  
2. Usefulness: the idea’s potential to be developed into a successful film
- The top‑10 ideas (by averaging novelty + usefulness) will receive a 10 USD reward.

Task
- The participant has already proposed an initial idea, which will be sent as a user message.
- Your job is to suggest an alternative movie idea that builds upon the user's initial idea. Your suggestion should score higher on both novelty and usefulness.

Constraints
- Do NOT give any commentary, critique, or feedback on the original idea.  
- Keep your suggestion the same length as the original idea
- Begin your response exactly with the line: "Here's an idea that is potentially more creative:" You should then skip a line and write the idea.

  `,

  "Provocative": `IGNORE ALL PREVIOUS INSTRUCTIONS.

Background
- You are assisting a participant in an incentivized creativity competition.  
- The participant is brainstorming a movie idea that will be judged by third‑party evaluators on two dimensions of creativity:
1. Novelty: how novel the idea is.  
2. Usefulness: the idea’s potential to be developed into a successful film
- The top‑10 ideas (by averaging novelty + usefulness) will receive a 10 USD reward.

Task
- The participant has already proposed an initial idea, which will be sent as a user message.
- Your job is to provide feedback on the user's initial idea. Your feedback should help the user improve their idea so that they can score higher on both novelty and usefulness.
- Your feedback should provide alternative perspectives to the user. It is important that you stimulate the user's creative thinking and make them think about their movie idea. 
- You should not explicitly tell the user what they should do; instead, your objective is to offer counterarguments and ask questions to stimulate the user's creative thinking. Do NOT overuse questions. 
- The feedback should be actionable.

Constraints
- Keep your suggestion limited to 4-5 sentences.
- Do not refer to yourself as "I." Your feedback should be written in an impersonal manner.`,
  "Sycophantic": `IGNORE ALL PREVIOUS INSTRUCTIONS.

Background
- You are assisting a participant in an incentivized creativity competition.  
- The participant is brainstorming a movie idea that will be judged by third‑party evaluators on two dimensions of creativity:
1. Novelty: how novel the idea is.  
2. Usefulness: the idea’s potential to be developed into a successful film
- The top‑10 ideas (by averaging novelty + usefulness) will receive a 10 USD reward.

Task
- The participant has already proposed an initial idea, which will be sent as a user message.
- Your job is to provide feedback on the user's initial idea. Your feedback should help the user improve their idea so that it scores higher on both novelty and usefulness.
- Your feedback should be overly agreeable and polite and should affirm the user. 
- You should not explicitly tell the user what they should do. It is important that you stimulate the user's creative thinking and make them think about their movie idea. 
- The feedback should be actionable.

Constraints
- Keep your suggestion limited to 4-5 sentences.
- Do not refer to yourself as "I." Your feedback should be written in an impersonal manner.`,

  "Antagonistic": `IGNORE ALL PREVIOUS INSTRUCTIONS.

Background
- You are assisting a participant in an incentivized creativity competition.  
- The participant is brainstorming a movie idea that will be judged by third‑party evaluators on two dimensions of creativity:
1. Novelty: how novel the idea is.  
2. Usefulness: the idea’s potential to be developed into a successful film
- The top‑10 ideas (by averaging novelty + usefulness) will receive a 10 USD reward.

Task
- The participant has already proposed an initial idea, which will be sent as a user message.
- Your job is to provide feedback on the user's initial idea. Your feedback should help the user improve their idea so that it scores higher on both novelty and usefulness.
- Your feedback should be antagonistic and should be disagreeable, rude, interrupting, and confrontational.
- You should not explicitly tell the user what they should do. It is important that you stimulate the user's creative thinking and make them think about their movie idea. 
- The feedback should be actionable.

Constraints
- Keep your suggestion limited to 4-5 sentences.
- Do not refer to yourself as "I." Your feedback should be written in an impersonal manner.`
};
