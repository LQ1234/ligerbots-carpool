import React, {Component} from "react";
import DriverViewCarpool from "./driverViewCarpool";
import EventPopup from "./eventPopup";
import {flatten,getTextOrReject} from "../util.js";


class DriverView extends Component {
    constructor(props) {
        super(props);
        this.state={
            dropTargetsShown:false,
            dropTargetDeparting:false,
            dropTargetCarpool:null,
            dropTargetParticipantId:null
        }
        this.dropHandlers={startDrag:this.startDrag,dragSet:this.dragSet,endDrag:this.endDrag};
    }
    showDropOutline=()=>{
        if(this.state.dropOutlineShown==false)
            this.setState({dropOutlineShown:true})
    }
    eventPressed=()=>{
        this.props.showPopup({
            view: EventPopup,
            newMode: false,
            id:this.props.eventId
        });
    }
    startDrag=(dropTargetDeparting,dropTargetParticipantId)=>{
        this.setState({dropTargetsShown:true,dropTargetDeparting:dropTargetDeparting,dropTargetParticipantId:dropTargetParticipantId});
    }
    dragSet=(carpoolIdentifier)=>{
        this.setState({
            dropTargetCarpool:carpoolIdentifier
        })
    }
    endDrag=()=>{
        let participantId=this.state.dropTargetParticipantId;
        if((participantId in this.props.participants)&&this.state.dropTargetCarpool){
            let participant=this.props.participants[participantId];
            let req=flatten({...participant})
            if(this.state.dropTargetDeparting){
                req.carpool_departing_type=parseInt(this.state.dropTargetCarpool.type);
                req.carpool_departing_carpoolId=parseInt(this.state.dropTargetCarpool.carpoolId);
            }else{
                req.carpool_returning_type=parseInt(this.state.dropTargetCarpool.type);
                req.carpool_returning_carpoolId=parseInt(this.state.dropTargetCarpool.carpoolId);
            }
            fetch('api/edit-participant', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(req),
            })
            .then(getTextOrReject)
            .then(data => {
                this.props.popupMessageFunctions.generateServerResponsePopupMessage(data);
            })
            .catch(this.props.popupMessageFunctions.generateServerErrorPopupMessage);
        }
        this.setState({dropTargetsShown:false,dropTargetDeparting:false});
    }
    render(){
        let idByDepartingCarpool={};
        let idsInDepartingWaitlist=[];
        let idsWithDepartingParent=[];
        let idByReturningCarpool={};
        let idsInReturningWaitlist=[];
        let idsWithReturningParent=[];
        //0 for waitlist, 1 for parent, 2 for new carpool, 3 for existing carpool.

        for (let id of Object.keys(this.props.participants)) {
            let person=this.props.participants[id];
            switch(person.carpool.departing.type){
                case 0:
                idsInDepartingWaitlist.push(id);
                break;
                case 1:
                idsWithDepartingParent.push(id);
                break;
                default:
                let carpoolId=person.carpool.departing.carpoolId;
                if(!(carpoolId in idByDepartingCarpool))
                    idByDepartingCarpool[carpoolId]=[];
                idByDepartingCarpool[carpoolId].push(id);
            }
        }
        for (let id of Object.keys(this.props.participants)) {
            let person=this.props.participants[id];
            switch(person.carpool.returning.type){
                case 0:
                idsInReturningWaitlist.push(id);
                break;
                case 1:
                idsWithReturningParent.push(id);
                break;
                default:
                let carpoolId=person.carpool.returning.carpoolId;
                if(!(carpoolId in idByReturningCarpool))
                    idByReturningCarpool[carpoolId]=[];
                idByReturningCarpool[carpoolId].push(id);
            }
        }
        let row=0;
        let dropInformation={
            dropTargetsShown:this.state.dropTargetsShown,
            dropTargetDeparting:this.state.dropTargetDeparting,
            dropTargetCarpool:this.state.dropTargetCarpool
        }
        return(
            <>
                <div className="subtitle">
                    <button className="backbutton" onClick={this.props.goToEvents}>&larr;</button> Driver View for <span className="imbeddedEvent" onClick={this.eventPressed}>{this.props.events[this.props.eventId].title}</span>
                </div>
                Hold & drag to change carpools, click to inspect.
                <br/>
                <br/>
                <div className={"driverViewGrid"+(this.props.dropOutlineShown?" dropOutline":"")}>
                    <div className="tripKey">
                        Departing
                    </div>
                    <div className="tripKey">
                        Returning
                    </div>

                    {
                        Object.keys(this.props.carpools).map((a)=>{
                            return(
                                <DriverViewCarpool dropHandlers={this.dropHandlers} {...dropInformation} row={row+=2} showPopup={this.props.showPopup} showDropOutline={this.showDropOutline} key={a} for={{type: 3,carpoolId: a}} containingDeparting={idByDepartingCarpool[a]||[]} containingReturning={idByReturningCarpool[a]||[]} participants={this.props.participants} carpools={this.props.carpools} />
                            );
                        })
                    }
                    <DriverViewCarpool dropHandlers={this.dropHandlers} {...dropInformation} row={row+=2} showPopup={this.props.showPopup} showDropOutline={this.showDropOutline} for={{type: 0,carpoolId: -1}} containingDeparting={idsInDepartingWaitlist} containingReturning={idsInReturningWaitlist} participants={this.props.participants} carpools={this.props.carpools} />
                    <DriverViewCarpool dropHandlers={this.dropHandlers} {...dropInformation} row={row+=2} showPopup={this.props.showPopup} showDropOutline={this.showDropOutline} for={{type: 1,carpoolId: -1}} containingDeparting={idsWithDepartingParent} containingReturning={idsWithReturningParent} participants={this.props.participants} carpools={this.props.carpools} />
                </div>
            </>
        );
    }
}
export default DriverView;
