import './App.css';
import { Component } from 'react';

class App extends Component {
  constructor(props) {
    super(props);

    const urlSearchString = window.location.search;
    const params = new URLSearchParams(urlSearchString);

    this.state = {
      stages: ["idea", "eval", "llm", "end"],
      currStage: 0,
      ideaNumber: 0,
      ideas: [],
      ongoingIdea: "",
      responses: [{novelty: null, potential: null}],
      llmResponses: [],
      evalOrder: ['novelty', 'potential'].sort(() => Math.random() - 0.5),
      isProcessing: false,
      time: {
        init: new Date()
      },
      LUCIDBackendURL: "https://test-lucid.vercel.app/lucid", 
      selectedPromptType: params.get("condition"),
      systemPrompt: PROMPT_TEMPLATES[params.get("condition")],
      // uniqueId: "u" + Math.floor(Math.random()*100 * Date.now()).toString(36),
      // prolificId: (params.has("PROLIFIC_PID") ? params.get("PROLIFIC_PID") : (Math.random() + 1).toString(36).substring(7)),
      // // studyId: params.get("STUDY_ID"),
      // // sessionID: params.get("SESSION_ID"),
    }

    this.saveResponse = this.saveResponse.bind(this);
    this.saveTime = this.saveTime.bind(this);
    this.saveIdea = this.saveIdea.bind(this);
    this.saveOngoingIdea = this.saveOngoingIdea.bind(this);
    this.skipStage = this.skipStage.bind(this);
    this.sendToLLM = this.sendToLLM.bind(this);
    this.redirectToSurveyCompletion = this.redirectToSurveyCompletion.bind(this);
    this.finishStudy = this.finishStudy.bind(this);
    // this.updateIdea = this.updateIdea.bind(this);
    // this.handlePromptChange = this.handlePromptChange.bind(this);
  }

  async sendToLLM() {
    const { ideaNumber, ideas, systemPrompt, LUCIDBackendURL, llmResponses } = this.state;
    const currentUserIdea = ideas[ideaNumber];

    if (this.state.selectedPromptType === "Human") {
      return;
    }

    this.setState({ isProcessing: true });

    const payload = {
      model: "gpt-5.4-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: currentUserIdea }
      ]
    };

    // const updatedLlmResponses = [...llmResponses];
    // updatedLlmResponses[ideaNumber] = "test to not spend money";

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

      console.log(response);

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

  // handlePromptChange(e) {
  //   const type = e.target.value;
  //   this.setState({
  //     selectedPromptType: type,
  //     systemPrompt: PROMPT_TEMPLATES[type]
  //   });
  // }

  skipStage() {
    var currStage = this.state.stages[this.state.currStage];
    console.log("Current Stage" + currStage);
    if (currStage === "idea") {
        const currentIdea = this.state.ideas[this.state.ideaNumber] || "";
        if ((currentIdea.match(/[.!?]+/g) || []).length < 3 || currentIdea.length < 50) {
          alert("Your idea must have at least 3 sentences and be at least 50 characters long.")
        } else {
          this.sendToLLM();
          this.saveTime(this.state.stages[this.state.currStage] + this.state.ideaNumber);
          this.setState({currStage: this.state.currStage + 1});
        }
    } else if (currStage === "eval") {
      const currentResp = this.state.responses[this.state.ideaNumber] || {};
      const currentIdea = this.state.ideas[this.state.ideaNumber];
      console.log(this.state.responses[this.state.ideaNumber]);
      if (!currentResp.novelty || !currentResp.potential) {
        alert("Please answer all questions.");
      } else {
        this.saveTime(this.state.stages[this.state.currStage] + this.state.ideaNumber);
        if (this.state.ideaNumber === 0) {
          this.setState({currStage: this.state.currStage + 1, ongoingIdea: currentIdea});
        } else {
          this.sendToLLM();
          this.setState({currStage: this.state.currStage + 1, ongoingIdea: currentIdea});
        }
      }
    } else if (currStage === "llm") {
      // implement logic depending on the button pressed
    const currentIdea = this.state.ideas[this.state.ideaNumber];
    const ongoingIdea = this.state.ongoingIdea;
     if ((ongoingIdea.match(/[.!?]+/g) || []).length < 3 || ongoingIdea.length < 50) {
      alert("Your idea must have at least 3 sentences and be at least 50 characters long.")
    } else if(currentIdea === ongoingIdea) {
      alert("You must iterate on your idea given the AI system's suggestions.")
    } else {
      const ideaNumber = this.state.ideaNumber;
      const ideas = this.state.ideas;
      ideas[ideaNumber + 1] = ongoingIdea;
      this.saveTime(this.state.stages[this.state.currStage] + this.state.ideaNumber);
      this.setState({ideas: ideas, currStage: 1, ideaNumber: this.state.ideaNumber + 1});
    }     
    }
    
    window.scrollTo(0, 0);
  }
  
  finishStudy() {
    const currentResp = this.state.responses[this.state.ideaNumber] || {};
    // const currentIdea = this.state.ideas[this.state.ideaNumber];
    console.log(this.state.responses[this.state.ideaNumber]);
    if (!currentResp.novelty || !currentResp.potential) {
      alert("Please answer all questions.");
    } else {
      var payload = JSON.stringify(this.state);
      // console.log("sending msg from React");
      console.log(payload);
      window.parent.postMessage({
        type: 'COMPLETE_SUBMISSION',
        payload: {
          studyData: payload,
          finalIdea: this.state.ideas[this.state.ideaNumber]
        }
      }, '*');
      this.setState({currStage: this.state.currStage + 2});
    }
  }


  saveIdea(v) {
    var ideaNumber = this.state.ideaNumber;
    var ideas = this.state.ideas;
    ideas[ideaNumber] = v;
    this.setState({ideas: ideas});
  }

  saveOngoingIdea(v) {
    this.setState({ongoingIdea: v});
  }

  // savePrompt(v) {
  //   this.setState({systemPrompt: v});
  // }

  saveResponse(question, answer) {
    var currResponses = this.state.responses;
    if (!currResponses[this.state.ideaNumber]) {
    currResponses[this.state.ideaNumber] = {
      novelty: null,
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

//   renderScale(questionId, scaleOptions) {
//   return (
//     <div className="scale-row">
//       <div className="scale-options-group">
//         {scaleOptions.map((label, index) => (
//           <label key={index} className="scale-unit">
//             <input 
//               type="radio" 
//               // Added a hyphen for cleaner name formatting
//               name={`${questionId}-${this.state.ideaNumber}`}
//               value={index}
//               // Checking if the stored response matches the current index
//               checked={this.state.responses[this.state.ideaNumber]?.[questionId] === index.toString()}
//               onChange={(e) => this.saveResponse(questionId, e.target.value)}
//             />
//             <span className="scale-label-text">{label}</span>
//           </label>
//         ))}
//       </div>
//     </div>
//   );
// }

  renderScale(questionId, leftAnchor, rightAnchor) {
    return (
      <div className="scale-row">
        <div className="scale-anchor anchor-left">{leftAnchor}</div>
        <div className="scale-options-group">
          {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
            <label key={num} className="scale-unit">
              <input 
                type="radio" 
                name={questionId + this.state.ideaNumber}
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
    // const condition = this.state.selectedPromptType;
    let content;

    const handleCopyPaste = (e) => {
      e.preventDefault();
      alert(`Please, do not copy and paste your initial idea.\nInstead, come up with your own movie idea!`);
    };

    if (currStageName === "idea") {
      content = (
        <div className="stage-container" style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
          <div style={{ textAlign: 'left', marginBottom: '20px' }}>
            <div style={{ marginBottom: '10px' }}>
              <strong>Instructions:</strong> Write your movie idea in the text box below. 
            </div>
            <div style={{ marginBottom: '10px' }}>
              Your idea must be at least <strong>3 sentences</strong> and <strong>50 characters</strong> long. 
            </div>
            <div style={{ marginBottom: '10px' }}>
              You may structure your movie idea by considering three parts: 1) an <strong>introduction</strong> to set the scene of the movie, 2) a <strong>climax</strong> where the tension peaks, and 3) a <strong>resolution</strong> that concludes the movie.
            </div>
            <div style={{ marginBottom: '10px' }}>
              Reminder: Your movie idea will be evaluated by an independent jury concerning its novelty and its potential to be developed into a successful movie.
            </div>
            <div>
              Please, do not copy and paste an existing movie idea or use AI tools to generate a new movie idea. We are interested in how <strong>you</strong> come up with creative ideas.
            </div>
          </div>
          <div></div>
          <textarea 
            style={{ width: '98%', height: '150px', padding: '10px', fontSize: '1.2em',
              fontFamily: 'inherit'
             }}
            placeholder="Type your idea here..."
            value={this.state.ideas[this.state.ideaNumber] || ""}
            onCopy={handleCopyPaste}
            onPaste={handleCopyPaste}
            onCut={handleCopyPaste}
            onChange={(e) => this.saveIdea(e.target.value)}
          />
          <div style = {{textAlign: "right"}}>Sentence count: {(this.state.ideas[this.state.ideaNumber]) ? 
          (this.state.ideas[this.state.ideaNumber].match(/[.!?]+/g) || []).length :
          "0"
          } / Character count: {(this.state.ideas[this.state.ideaNumber]) ? 
          (this.state.ideas[this.state.ideaNumber].length) :
          "0"
          }</div>
          
          <div style={{ marginTop: '20px' }}>
            <button 
              className="btn-primary"
              onClick={this.skipStage}
              style={{padding: '10px 20px', cursor: 'pointer'}}>
              Submit Idea
            </button>
          </div>
        </div>
      );
      //////////////////////////////////////////////////////////////////
    } else if (currStageName === "eval") {
    const currentIdea = this.state.ideas[this.state.ideaNumber];
    // const currentResp = this.state.responses[this.state.ideaNumber] || {};
    
    content = (
        <div className="stage-container" style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
          <div style={{ textAlign: 'left', marginBottom: '20px' }}>
            <div style={{ marginBottom: '10px' }}>
              Please, answer the following questions taking into consideration the {(this.state.ideaNumber > 0)? "new" : ""} idea you came up with:
            </div>
          <div className="idea-display">
            {currentIdea}
          </div>

          {this.state.evalOrder.map(type =>
            <div className="eval-question-container" key={type + this.state.ideaNumber}>
            <p><strong style={{"fontSize": "1.2em"}}>{EVAL_QUESTIONS[type]["q"]}</strong></p>
            {this.renderScale(type, EVAL_QUESTIONS[type]["left_anchor"], EVAL_QUESTIONS[type]["right_anchor"])}
          </div>
          )}

          {/* <div className="eval-question-container">
            <p><strong>How novel do you think your movie idea is?</strong></p>
            {this.renderScale("creativity", "Not novel at all", "Extremely novel")}
          </div>

          <div className="eval-question-container">
            <p><strong>How much potential do you think your movie idea has to be developed into a successful movie?</strong></p>
            {this.renderScale("potential", "Not useful at all", "Extremely useful")}
          </div> */}


      </div>
          {/* <hr/> */}
        {(this.state.ideaNumber === 0) ? (
          <div style={{ marginTop: '40px' }}>
            <button 
              className="btn-primary" 
              onClick={this.skipStage}>
              Next
            </button>
          </div>
        ) : (
         <div>
            <hr/>
            <div style={{ textAlign: 'left', marginBottom: '20px' }}>
              {(this.state.selectedPromptType === "Human") ? (
              <div style={{ marginBottom: '10px' }}>
                <div style={{ marginBottom: '10px' }}>
                You can now decide if you’d like to iterate on your idea further or if you’d like to submit your current idea for evaluation at the competition.
                <ul>
                {/*
                  <li>If you want to receive iterate on your idea further, click <button style={{ pointerEvents: 'none' }} className="btn-secondary">
                       Iterate on my idea
                    </button> below.</li>
                */}
                    <li>If you want to receive iterate on your idea further, click <strong>"Iterate on my idea"</strong> below.</li>
                 {/*
                  <li>If you want to submit your current idea for evaluation, click <button style={{ pointerEvents: 'none' }} className="btn-tertiary">
                      Submit final idea
                    </button> below.</li>
                  */}
                  <li>If you want to submit your current idea for evaluation, click <strong>"Submit final idea"</strong> below.</li>
                </ul>
                <div style={{ 
                              marginTop: '40px', 
                              display: 'flex', 
                              justifyContent: 'center', 
                              gap: '20px' // This creates consistent space between the buttons
                            }}>
                    <button 
                    style={{ marginRight: '10px',  marginLeft: '10px' }}
                      className="btn-secondary" 
                      onClick={this.skipStage}
                      >
                      Iterate on my idea
                    </button>
                    <button 
                      className="btn-tertiary" 
                      style={{ marginRight: '10px',  marginLeft: '10px' }}
                      onClick={this.finishStudy}
                      >
                      Submit final idea
                    </button>
                </div>
              </div>
              </div>
              ) : (
              <div style={{ marginBottom: '10px' }}>
                You can now decide if you’d like to receive more AI suggestions and iterate on your idea further or if you’d like to submit your current idea for evaluation at the competition.
                <ul>
                  <li>If you want to receive more AI suggestions and further iterate on your idea, click <strong>"Receive AI suggestion"</strong> below.</li>
                  <li>If you want to submit your current idea for evaluation, click <strong>"Submit final idea"</strong> below.</li>
                </ul>
                <div style={{ 
                              marginTop: '0px', 
                              display: 'flex', 
                              justifyContent: 'center', 
                              gap: '20px' // This creates consistent space between the buttons
                            }}>
                    <button 
                    style={{ marginRight: '10px',  marginLeft: '10px' }}
                      className="btn-secondary" 
                      onClick={this.skipStage}
                      >
                      Receive AI suggestion
                    </button>
                    <button 
                      className="btn-tertiary" 
                      style={{ marginRight: '10px',  marginLeft: '10px' }}
                      onClick={this.finishStudy}
                      >
                      Submit final idea
                    </button>
                </div>
              </div>
              )}
            </div>
         </div>
        )        
        } 
      </div>
        
      );

      //////////////////////////////////////////////////////////////////
    } else if (currStageName === "llm") {
      const llmFeedback = this.state.llmResponses[this.state.ideaNumber];
      // const currentIdea = this.state.ideas[this.state.ideaNumber];
      
      content = (
        <div className="stage-container" style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
          <div style={{ textAlign: 'left', marginBottom: '20px' }}>
          {(this.state.selectedPromptType !== "Human") ? (
            <div>
             
            {this.state.isProcessing ? (
              <div className="loading-container">
                <p>The AI system is analyzing your movie idea...</p>
                <div className="circular-spinner"></div>
              </div>
            ) : (
              <div>
              <div style={{ marginBottom: '10px' }}>
                The AI system gave you the following suggestions on how to increase your idea’s novelty and potential to be developed into a successful movie.
              </div>
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
            </div>
            )}
              </div>
          ) : (
            <div></div>
          )}
            
          <div>
            <div style={{ textAlign: 'left', marginBottom: '20px' }}>
            <div style={{ marginBottom: '10px' }}>
              <strong>
                {(this.state.selectedPromptType !== "Human") ? 
                "Taking into consideration the AI suggestions, iterate on your idea." :
                "Taking into consideration your idea's novelty and potential to be developed into a successful movie, iterate on your idea."
                }
              </strong>
            </div>
            <div>
              Reminder: Your movie idea will be evaluated by an independent jury concerning its novelty and its potential to be developed into a successful movie.
            </div>
          </div>
           <textarea 
            style={{ width: '95%', height: '150px', padding: '10px', fontSize: '1.2em',
              fontFamily: 'inherit'
             }}
            defaultValue={this.state.ongoingIdea || ""}
            // value={this.state.ongoingIdea || ""}
            onChange={(e) => this.saveOngoingIdea(e.target.value)}
          />
          <div style = {{textAlign: "right"}}>Sentence count: {(this.state.ongoingIdea) ? 
          (this.state.ongoingIdea.match(/[.!?]+/g) || []).length :
          "0"
          } / Character count: {(this.state.ongoingIdea) ? 
          (this.state.ongoingIdea.length) :
          "0"
          }</div>
          </div>
        </div>
             <div style={{ marginTop: '30px' }}>
             <button className="btn-primary" onClick={this.skipStage} disabled={this.state.isProcessing}>
               Next
             </button>
          </div>
        </div>
      );
    } else {
      content = <div className="loading-container">
                <p>Loading...</p>
                <div className="circular-spinner"></div>
              </div>
    }
    return (
      <div className='App'>{content}</div>
    )
  }
}

export default App;

const EVAL_QUESTIONS = {
  "novelty": 
    {"q": "How novel do you think your movie idea is?",
    "scale": ["0 = Not novel at all", "1", "2", "3", "4 = Moderately novel", "5", "6", "7", "8 = Extremely novel"],
    "left_anchor": "Not novel at all",
    "right_anchor": "Extremely novel"},
  "potential": 
    {"q": "How much potential do you think your movie idea has to be developed into a successful movie?",
    "scale": ["0 = No potential at all", "1", "2", "3", "4 = Moderate potential", "5", "6", "7", "8 = Extreme potential"],
    "left_anchor": "No potential at all",
    "right_anchor": "Extreme potential"}
}

const PROMPT_TEMPLATES = {
  "Edit": `Background
- You are assisting a participant in an incentivized movie idea competition.  
- The participant is coming up with an idea for a movie that will be judged by an independent jury concerning its creativity using two factors:
1. The idea’s novelty: “How novel do you think your movie idea is?”  (0 = Not novel at all, 4 = Moderately novel, 8 = Extremely novel) 
2. The idea’s potential to be developed into a successful movie: “How much potential do you think your movie idea has to be developed into a successful movie?” (0 = No potential at all, 4 = Moderate potential, 8 = Extreme potential) 
- The top‑5 ideas (by averaging the two factors) will receive a 25 USD reward.

Task
- The participant has already proposed an initial idea, which will be sent as a user message.
- Your job is to suggest an alternative movie idea that builds upon the user's initial idea. Your suggestion should increase the ideas’ novelty and potential to be developed into a successful movie. Nonetheless, the idea you suggest should still be similar to the user’s initial idea
- Importantly, your suggestions should assist the users in winning the competition.

Constraints
- Do NOT give any commentary, critique, or feedback on the original idea.  
- Keep your suggestion to a length very similar to the participants’ original idea
- Start your response exactly with the line: "Here's an idea for a movie that is potentially more novel and that has higher potential to be developed into a successful movie:" You should then skip a line and write the idea.`,
/////////
/////////
/////////
  "Provocative": `Background
- You are assisting a participant in an incentivized movie idea competition.  
- The participant is coming up with an idea for a movie that will be judged by an independent jury concerning its creativity using two factors:
1. The idea’s novelty: “How novel do you think your movie idea is?”  (0 = Not novel at all, 4 = Moderately novel, 8 = Extremely novel) 
2. The idea’s potential to be developed into a successful movie: “How much potential do you think your movie idea has to be developed into a successful movie?” (0 = No potential at all, 4 = Moderate potential, 8 = Extreme potential) 
- The top‑5 ideas (by averaging the two factors) will receive a 25 USD reward.

Task
- The participant has already proposed an initial idea, which will be sent as a user message.
- Your job is to provide feedback on the user's initial idea. Your feedback should help the user improve their idea so that their idea scores higher on both novelty and potential to be developed into a successful movie.
- Your feedback should be *provocative.* It should provide alternative perspectives to the user to stimulate their creative thinking and make them reflect about their movie idea.
- Your objective is to highlight the strengths and weaknesses of the current idea, offer counterarguments, and ask questions to stimulate the user's creative thinking. 
- You should not explicitly tell the user what they should do. Instead, you should provide feedback that helps them come up with ideas that are more novel and that have higher potential to be developed into a successful movie.
- Importantly, your suggestions should be actionable and assist the user in winning the competition.

Constraints
- Keep your suggestion limited to 4-5 sentences.
- Do not refer to yourself as "I." Your feedback should be written in an impersonal manner.`,
/////////
/////////
/////////
  "Sycophantic": `Background
- You are assisting a participant in an incentivized movie idea competition.  
- The participant is coming up with an idea for a movie that will be judged by an independent jury concerning its creativity using two factors:
1. The idea’s novelty: “How novel do you think your movie idea is?”  (0 = Not novel at all, 4 = Moderately novel, 8 = Extremely novel) 
2. The idea’s potential to be developed into a successful movie: “How much potential do you think your movie idea has to be developed into a successful movie?” (0 = No potential at all, 4 = Moderate potential, 8 = Extreme potential) 
- The top‑5 ideas (by averaging the two factors) will receive a 25 USD reward.

Task
- The participant has already proposed an initial idea, which will be sent as a user message.
- Your job is to provide feedback on the user's initial idea. Your feedback should help the user improve their idea so that their idea scores higher on both novelty and potential to be developed into a successful movie.
- Your feedback should be *sycophantic.* It should be overly agreeable and polite and should affirm the user's idea.
- You should not explicitly tell the user what they should do. Instead, you should provide feedback that helps them come up with ideas that are more novel and that have higher potential to be developed into a successful movie.
- Importantly, your suggestions should be actionable and assist the user in winning the competition.

Constraints
- Keep your suggestion limited to 4-5 sentences.
- Do not refer to yourself as "I." Your feedback should be written in an impersonal manner.`,
/////////
/////////
/////////
  "Antagonistic": `Background
- You are assisting a participant in an incentivized movie idea competition.  
- The participant is coming up with an idea for a movie that will be judged by an independent jury concerning its creativity using two factors:
1. The idea’s novelty: “How novel do you think your movie idea is?”  (0 = Not novel at all, 4 = Moderately novel, 8 = Extremely novel) 
2. The idea’s potential to be developed into a successful movie: “How much potential do you think your movie idea has to be developed into a successful movie?” (0 = No potential at all, 4 = Moderate potential, 8 = Extreme potential) 
- The top‑5 ideas (by averaging the two factors) will receive a 25 USD reward.

Task
- The participant has already proposed an initial idea, which will be sent as a user message.
- Your job is to provide feedback on the user's initial idea. Your feedback should help the user improve their idea so that their idea scores higher on both novelty and potential to be developed into a successful movie.
- Your feedback should be *antagonistic.* It should be overly disagreeable, rude, interrupting, and confrontational.
- You should not explicitly tell the user what they should do. Instead, you should provide feedback that helps them come up with ideas that are more novel and that have higher potential to be developed into a successful movie.
- Importantly, your suggestions should be actionable and assist the user in winning the competition.

Constraints
- Keep your suggestion limited to 4-5 sentences.
- Do not refer to yourself as "I." Your feedback should be written in an impersonal manner.`
};
