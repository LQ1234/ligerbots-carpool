import React, {Component,Fragment} from "react";
import ParticipantPopup from "./participantPopup";
import CarpoolPopup from "./carpoolPopup";


class ParticipantViewParticipant extends React.Component {
    constructor(props) {
        super(props);
        this.state={
        }
    }
    participantPressed=()=>{
        this.props.showPopup({
            view: ParticipantPopup,
            id:this.props.id
        });
    }
    departingCarpoolPressed=()=>{
        if(this.props.carpool.departing.type==3){
            this.props.showPopup({
                view: CarpoolPopup,
                id:this.props.carpool.departing.carpoolId
            });
        }
    }
    returningCarpoolPressed=()=>{
        if(this.props.carpool.returning.type==3){
            this.props.showPopup({
                view: CarpoolPopup,
                id:this.props.carpool.returning.carpoolId
            });
        }
    }
    nameOfCarpool=(carpool)=>{
        let type=carpool.type;//Doesn't work if i refrence directly for some reason
        let carpoolId=carpool.carpoolId;
        switch(type){
            case 0:
                return("Waitlist");
            case 1:
                return("Parent");
            case 4:
                return("");
            default:
                let carpool=Object.values(this.props.carpools).find((c)=>c.id==carpoolId);
                return(carpool?carpool.name:"<Invalid car>")
        }
    }

    render(){
        return(<Fragment key={this.props.id}>
            <div className={"participantViewParticipant"+(this.props.carpool.drivingCarpool!=null?" driver":"")} >{this.props.personalInformation.name}</div>
            <div>{this.nameOfCarpool(this.props.carpool.departing)}</div>
            <div>{this.nameOfCarpool(this.props.carpool.returning)}</div>
        </Fragment>)
    }
}
export default ParticipantViewParticipant;
