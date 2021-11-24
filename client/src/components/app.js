import React, {Component} from "react";
import PopupMessage from "./popupMessage";
import EventPopup from "./eventPopup";
import CarpoolPopup from "./carpoolPopup";
import ParticipantPopup from "./participantPopup";
import ParticipantView from "./participantView";
import DriverView from "./driverView";
import AddForm from "./addForm";
import EventList from "./eventList";

import {shouldOpenInNewTab,unflatten,flatten,objectFilter,eventWithRealDate, api_root} from "../util.js";

class App extends Component {
    constructor(props){
        super(props);
        this.state={
            shownPopup:{
                view: null,
                id: -1
            },
            receivedResponse:false,
            participants:{},
            carpools:{},
            events:{},
            shownPopupMessage:null,
            showClickDetect: false,
            adminMode: window.logindata.split(",")[0] == "admin"
        }
        this.searchParams=new URLSearchParams(window.location.search);
        this.clickDetectCallback = null;
        if(["add-form-passenger","add-form-carpool","participant-view"].includes(this.searchParams.get("view"))){
            let eventId=parseInt(this.searchParams.get("eventId"));
            if(isNaN(eventId)){
                this.state.view="event-list";
            }else{
                this.state.view=this.searchParams.get("view");
                this.state.eventId=eventId;
            }
        }else{
            this.state.view="event-list";
        }

        Promise.all([
            fetch(api_root+'events', {
                method: 'GET',
            }),
            fetch(api_root+'carpools', {
                method: 'GET',
            }),
            fetch(api_root+'participants', {
                method: 'GET',
            })
        ]).then((res)=>{
            return(Promise.all(res.map(x=>x.json())));
        }).then((res)=>{
            this.setState((state)=>{
                return{
                    ...state,
                    receivedResponse:true,
                    events:{...state.events,...res[0].events.reduce((b,a)=>({...b,[a.id]:eventWithRealDate(unflatten(a))}),{})},
                    carpools:{...state.carpools,...res[1].carpools.reduce((b,a)=>({...b,[a.id]:unflatten(a)}),{})},
                    participants:{...state.participants,...res[2].participants.reduce((b,a)=>({...b,[a.id]:unflatten(a)}),{})}
                }
            })
        });
        var evtSource = new EventSource(api_root+'update-stream');

        evtSource.addEventListener("put-event", (e) => {
            let parsed=unflatten(JSON.parse(e.data));
            this.setState((state)=>{
                return({
                    ...state,
                    events:{
                        ...state.events,
                        [parsed.id]:eventWithRealDate(parsed)
                    }
                })
            });
        })
        evtSource.addEventListener("delete-event", (e) => {
            let parsed=unflatten(JSON.parse(e.data));
            this.setState((state)=>{
                let eventsClone=Object.assign({}, state.events);
                delete eventsClone[parsed.id]
                return({
                    ...state,
                    participants:objectFilter(state.participants,(id,obj)=>obj.eventId!=parsed.id),
                    carpools:objectFilter(state.carpools,(id,obj)=>obj.eventId!=parsed.id),
                    events:eventsClone
                })
            });
        });
        evtSource.addEventListener("put-participant", (e) => {
            let parsed=unflatten(JSON.parse(e.data));
            this.setState((state)=>{
                return({
                    ...state,
                    participants:{
                        ...state.participants,
                        [parsed.id]:parsed
                    }
                })
            });
        })
        evtSource.addEventListener("delete-participant", (e) => {
            let parsed=unflatten(JSON.parse(e.data));
            this.setState((state)=>{
                let participantsClone=Object.assign({}, state.participants);
                delete participantsClone[parsed.id]
                return({
                    ...state,
                    participants:participantsClone
                })
            });
        });
        evtSource.addEventListener("put-carpool", (e) => {
            let parsed=unflatten(JSON.parse(e.data));
            this.setState((state)=>{
                return({
                    ...state,
                    carpools:{
                        ...state.carpools,
                        [parsed.id]:parsed
                    }
                })
            });
        })
        evtSource.addEventListener("delete-carpool", (e) => {
            let parsed=unflatten(JSON.parse(e.data));
            this.setState((state)=>{
                let carpoolsClone=Object.assign({}, state.carpools);
                delete carpoolsClone[parsed.id]
                return({
                    ...state,
                    carpools:carpoolsClone
                })
            });
        });
        evtSource.addEventListener("refresh-participants", (e) => {
            fetch(api_root+'participants', {
                method: 'GET',
            })
            .then((res)=>{
                return(res.json());
            }).then((res)=>{
                this.setState((state)=>{
                    return{
                        ...state,
                        receivedResponse:true,
                        participants:{...res.participants.reduce((b,a)=>({...b,[a.id]:unflatten(a)}),{})}
                    }
                })
            });
        });
        this.popupMessageFunctions={
            showPopupMessage:this.showPopupMessage,
            generateServerResponsePopupMessage:this.generateServerResponsePopupMessage,
            generateServerErrorPopupMessage:this.generateServerErrorPopupMessage
        };
    }
    setClickDetectCallback=(callback)=>{
        this.clickDetectCallback = callback;
        this.setState({showClickDetect:callback!=null});
    }
    handleClickDetectClick=()=>{
        this.clickDetectCallback();
    }
    popStateListener=(e)=>{
        if(e.state==null){
            this.setState({view:"event-list"});
        }else{
            this.setState({view:e.state.view,eventId:e.state.eventId});
        }
    }
    changeView=(view,eventId,newTab)=>{
        if(newTab){
            this.searchParams.set("view",view);
            this.searchParams.set("eventId",eventId);
            window.open("?"+this.searchParams.toString());

        }else{
            this.setState({view:view,eventId:eventId});
            this.searchParams.set("view",view);
            this.searchParams.set("eventId",eventId);
            let stateObject={"view":view,"eventId":eventId};
            history.pushState(stateObject,"","?"+this.searchParams.toString());
        }
    }
    goToEvents=(e)=>{

        this.changeView("event-list",-1,e?shouldOpenInNewTab(e):false);
    }
    showPopup=(newPopup)=>{
        this.setState({
            shownPopup:newPopup
        });
    }
    hidePopup=(e)=>{
        this.setState({
            shownPopup:{
                view:null,
                id:-1,
                newMode:false
            }
        })
    }

    //unrelated popup message methods
    showPopupMessage=(newPopup)=>{
        this.setState({
            shownPopupMessage:newPopup
        });
    }
    hidePopupMessage=()=>{
        this.setState({
            shownPopupMessage:null
        });
    }
    generateServerResponsePopupMessage=(res)=>{
        try {
            let parsed=JSON.parse(res);
            if(parsed.result=="failure"){
                this.showPopupMessage({message:parsed.error,type:PopupMessage.error});
            }else if(parsed.result=="success"){

            }else{
                this.showPopupMessage({message:"Invalid server response",type:PopupMessage.error});
            }
        } catch (e) {
            this.showPopupMessage({message:"Invalid server response",type:PopupMessage.error});

        }
    }
    generateServerErrorPopupMessage=(err)=>{
        this.showPopupMessage({message:""+err,type:PopupMessage.error});
    }
    componentDidMount() {
        window.addEventListener("popstate", this.popStateListener)
    }
    componentWillUnmount() {
        window.removeEventListener("popstate", this.popStateListener)
    }

    render(){
        console.log();
        let carpoolByEventWithCount={};
        let participantByEvent={};

        for(let eventId of Object.keys(this.state.events)){
            carpoolByEventWithCount[eventId]={}
            participantByEvent[eventId]={}
        }
        for (let carpoolId of Object.keys(this.state.carpools)) {
            let carpool=this.state.carpools[carpoolId];
            carpoolByEventWithCount[carpool.eventId][carpoolId]=Object.assign({takenDeparting:0,takenReturning:0},carpool);//immutability
        }
        for (let participantId of Object.keys(this.state.participants)) {
            let participant=this.state.participants[participantId];
            participantByEvent[participant.eventId][participantId]=participant;

            if(participant.carpool.departing.type==3){
                let carpoolId=participant.carpool.departing.carpoolId;
                if(carpoolId in carpoolByEventWithCount[participant.eventId]){
                    carpoolByEventWithCount[participant.eventId][carpoolId].takenDeparting++;
                }else{
                    console.log("warning: participant in invalid carpool", participant);
                }
            }
            if(participant.carpool.returning.type==3){
                let carpoolId=participant.carpool.returning.carpoolId;
                if(carpoolId in carpoolByEventWithCount[participant.eventId]){
                    carpoolByEventWithCount[participant.eventId][carpoolId].takenReturning++;
                }else{
                    console.log("warning: participant in invalid carpool", participant);
                }
            }

        }




        let elem=null;
        let popup=null;
        let invalidEventIdError=<>
            <div>Invalid Event</div>
            <button type="button" name="button" onClick={this.goToEvents}>Go back</button>
        </>;
        if(this.state.receivedResponse){

            switch (this.state.view) {
                case "event-list":{
                    break;
                }
                case "add-form-passenger":
                case "add-form-carpool": {
                    let eventId=this.state.eventId;
                    if(!(eventId in this.state.events))elem=invalidEventIdError;
                    else elem=<AddForm popupMessageFunctions={this.popupMessageFunctions} goToEvents={this.goToEvents} showPopup={this.showPopup} changeView={this.changeView} events={this.state.events} eventId={eventId} participants={participantByEvent[eventId]} availableCarpools={carpoolByEventWithCount[eventId]} participantType={this.state.view.split("-").pop()}/>;
                    break;
                }
                case "participant-view":{
                    let eventId=this.state.eventId;
                    if(!(eventId in this.state.events))elem=invalidEventIdError;
                    else elem=<ParticipantView popupMessageFunctions={this.popupMessageFunctions} goToEvents={this.goToEvents} showPopup={this.showPopup} changeView={this.changeView} events={this.state.events} eventId={eventId} carpools={carpoolByEventWithCount[eventId]} participants={participantByEvent[eventId]}/>;
                    break;
                }
            }
            {
                switch(this.state.shownPopup.view){
                    case ParticipantPopup:{
                        if(!(this.state.shownPopup.id in this.state.participants))break;
                        let eventId=this.state.participants[this.state.shownPopup.id].eventId;
                        popup=<ParticipantPopup popupMessageFunctions={this.popupMessageFunctions} showPopup={this.showPopup} hidePopup={this.hidePopup} availableCarpools={carpoolByEventWithCount[eventId]} carpools={this.state.carpools} participants={this.state.participants} id={this.state.shownPopup.id} setClickDetectCallback={this.setClickDetectCallback}/>
                        break;
                    }
                    case CarpoolPopup:{
                        if(!(this.state.shownPopup.id in this.state.carpools))break;
                        let eventId=this.state.carpools[this.state.shownPopup.id].eventId;
                        popup=<CarpoolPopup popupMessageFunctions={this.popupMessageFunctions} showPopup={this.showPopup} hidePopup={this.hidePopup} carpools={this.state.carpools} participants={this.state.participants} id={this.state.shownPopup.id}/>
                        break;
                    }
                    case EventPopup:{
                        if((!this.state.shownPopup.newMode)&&!(this.state.shownPopup.id in this.state.events))break;
                        popup=<EventPopup popupMessageFunctions={this.popupMessageFunctions} showPopup={this.showPopup} hidePopup={this.hidePopup} newMode={this.state.shownPopup.newMode} events={this.state.events} id={this.state.shownPopup.id}/>
                        break;
                    }
                }
            }
        }else{
            elem=<div>Loading...</div>
        }


        return(
            <>
                {this.state.shownPopupMessage?<PopupMessage hidePopupMessage={this.hidePopupMessage} {...this.state.shownPopupMessage}/>:null}

                {popup}
                <EventList popupMessageFunctions={this.popupMessageFunctions} goToEvents={this.goToEvents} showPopup={this.showPopup} changeView={this.changeView} events={this.state.events} allParticipants={participantByEvent} allCarpools={carpoolByEventWithCount} adminMode={this.state.adminMode}/>

                {elem}
                {this.state.showClickDetect?<div className="clickDetect" onClick={this.handleClickDetectClick}></div>:null}
            </>
        );
    }
}

export default App;
