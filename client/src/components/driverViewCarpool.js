import React, {Component} from "react";
import DriverViewCarpoolParticipant from "./driverViewCarpoolParticipant";
import CarpoolPopup from "./carpoolPopup";

class DriverViewCarpool extends Component {
    constructor(props) {
        super(props);
    }
    carpoolPressed=()=>{
        if(this.props.for.type==3){
            this.props.showPopup({
                view: CarpoolPopup,
                id:this.props.for.carpoolId
            });
        }

    }
    render(){
        let props=this.props;
        let name;
        let countInfo="";

        switch(props.for.type){
            case 0:
            name="Waitlist";
            break;
            case 1:
            name="Parent";
            break;
            default:{
                let carpool=props.carpools[props.for.carpoolId]
                if(carpool.trip==1){
                    countInfo+="No Departing Trip"
                }else{
                    countInfo+=`${carpool.takenDeparting}/${carpool.seats}`
                }
                countInfo+=", "
                if(carpool.trip==0){
                    countInfo+="No Returning Trip"
                }else{
                    countInfo+=`${carpool.takenReturning}/${carpool.seats}`
                }

                name=carpool.name;
            }
        }
        let driverId=props.for.type==3?props.carpools[props.for.carpoolId].driverId:-1;
        if(driverId>=0&&!(driverId in props.participants))driverId=-1;

        let isDropHovered=this.props.dropTargetCarpool&&(this.props.dropTargetCarpool.type==this.props.for.type&&(this.props.for.type!=3||this.props.dropTargetCarpool.carpoolId==this.props.for.carpoolId))
        return(
            <>
                {
                    this.props.dropTargetsShown?(
                        this.props.dropTargetDeparting?
                        <div className={"dropTarget"+(isDropHovered?" hover":"")} style={{"gridRow":`${this.props.row} / span 2`,"gridColumn":1}} data-type={this.props.for.type} data-carpool-id={this.props.for.carpoolId}></div>:
                        <div className={"dropTarget"+(isDropHovered?" hover":"")} style={{"gridRow":`${this.props.row} / span 2`,"gridColumn":2}} data-type={this.props.for.type} data-carpool-id={this.props.for.carpoolId}></div>
                    ):null
                }
                <div style={{"gridRow":this.props.row}} className={"carpoolHeader"+((this.props.for.type==3)?" underlineable":"")} onClick={this.carpoolPressed}>
                    {name}
                    <span className="countInfo">
                        {countInfo}
                    </span>
                </div>
                <div style={{"gridRow":this.props.row+1,"gridColumn":1}} className="carpoolTripContainer">
                    {//driver first
                        driverId>=0&&(props.participants[driverId].carpool.departing.type==3&&props.participants[driverId].carpool.departing.carpoolId==props.for.carpoolId)?
                        <DriverViewCarpoolParticipant isDepartingTrip={true} dropHandlers={this.props.dropHandlers} showPopup={this.props.showPopup} showDropOutline={this.props.showDropOutline} key={driverId} isDriver={true} participant={props.participants[driverId]}/>
                        :null
                    }
                    {
                        props.containingDeparting.map((id)=>{
                            if(driverId==id)return(null);
                            return(
                                <DriverViewCarpoolParticipant isDepartingTrip={true} dropHandlers={this.props.dropHandlers} showPopup={this.props.showPopup} showDropOutline={this.props.showDropOutline} key={id} isDriver={false} participant={props.participants[id]}/>
                            );
                        })
                    }
                </div>
                <div style={{"gridRow":this.props.row+1,"gridColumn":2}} className="carpoolTripContainer">
                    {//driver first
                        driverId>=0&&(props.participants[driverId].carpool.returning.type==3&&props.participants[driverId].carpool.returning.carpoolId==props.for.carpoolId)?
                        <DriverViewCarpoolParticipant isDepartingTrip={false} dropHandlers={this.props.dropHandlers} showPopup={this.props.showPopup} showDropOutline={this.props.showDropOutline} key={driverId} isDriver={true} participant={props.participants[driverId]}/>
                        :null
                    }
                    {
                        props.containingReturning.map((id)=>{
                            if(driverId==id)return(null);
                            return(
                                <DriverViewCarpoolParticipant isDepartingTrip={false} dropHandlers={this.props.dropHandlers} showPopup={this.props.showPopup} showDropOutline={this.props.showDropOutline} key={id} isDriver={false} participant={props.participants[id]}/>
                            );
                        })
                    }

                </div>

            </>
        );
    }
}
export default DriverViewCarpool;
