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
        let countInfo=[];
        let emptyDepartingMessage="Empty"
        let emptyReturningMessage="Empty"
        let hasnote = false;
        switch(props.for.type){
            case 0:
            name="Waitlist";
            break;
            case 1:
            name="Parent";
            break;
            default:{
                let carpool=props.carpools[props.for.carpoolId]
                var xoffset=15*(1+Math.max(carpool.seats, carpool.takenDeparting)+Math.max(carpool.seats, carpool.takenReturning));

                if(carpool.trip==1){
                    xoffset-=15*carpool.seats;

                    emptyDepartingMessage="No Departing Trip"
                }else{
                    for(let i=0;i<carpool.takenDeparting;i++){
                        countInfo.push(<div key={"departing"+i} style={{right:(xoffset-=15)+"px"}} className={i>=carpool.seats?"reddot":"filleddot"}></div>)
                    }
                    for(let i=carpool.takenDeparting;i<carpool.seats;i++){
                        countInfo.push(<div key={"departing"+i} style={{right:(xoffset-=15)+"px"}} className="emptydot"></div>)
                    }
                }
                countInfo.push(<div key="vertbar" className="vertbar" style={{right:(xoffset-=15)+"px"}}></div>)
                if(carpool.trip==0){
                    xoffset-=15*carpool.seats;
                    emptyReturningMessage="No Returning Trip"
                }else{
                    for(let i=0;i<carpool.takenReturning;i++){
                        countInfo.push(<div key={"returning"+i} style={{right:(xoffset-=15)+"px"}} className="filleddot"></div>)
                    }
                    for(let i=carpool.takenReturning;i<carpool.seats;i++){
                        countInfo.push(<div key={"returning"+i} style={{right:(xoffset-=15)+"px"}} className="emptydot"></div>)
                    }
                }

                name=carpool.name;
                if(carpool.note.trim())hasnote=true;
            }
        }
        let driverId=props.for.type==3?props.carpools[props.for.carpoolId].driverId:-1;
        if(driverId>=0&&!(driverId in props.participants))driverId=-1;

        let isDropHovered=this.props.dropTargetCarpool&&(this.props.dropTargetCarpool.type==this.props.for.type&&(this.props.for.type!=3||this.props.dropTargetCarpool.carpoolId==this.props.for.carpoolId))
        return(
            <div className={"driverViewGrid"+(this.props.for.type==0 || this.props.for.type==1?" specialcarpooltype":"")}>
                {
                    this.props.dropTargetsShown?(
                        this.props.dropTargetDeparting?
                        <div className={"dropTarget"+(isDropHovered?" hover":"")} style={{"gridRow":`${this.props.row} / span 2`,"gridColumn":1}} data-type={this.props.for.type} data-carpool-id={this.props.for.carpoolId}></div>:
                        <div className={"dropTarget"+(isDropHovered?" hover":"")} style={{"gridRow":`${this.props.row} / span 2`,"gridColumn":2}} data-type={this.props.for.type} data-carpool-id={this.props.for.carpoolId}></div>
                    ):null
                }
                <div style={{"gridRow":this.props.row}} className={"carpoolHeader whiteforeground "+((this.props.for.type==3)?" underlineable showeditsymbol":"")} onClick={this.carpoolPressed}>
                    {name} {hasnote ? <img src={window.carpool_root+"note.png"}/> : null}
                    <span className="countInfo">
                        {countInfo}
                    </span>
                </div>
                <div style={{"gridRow":this.props.row+1,"gridColumn":1}} className="carpoolTripContainer">
                    <div className="key">Departing Trip:</div>
                    {props.containingDeparting.length ?(
                        <>
                            {
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
                        </>
                    ):
                        <div className="carpoolParticipant"><i style={{color:"grey", fontSize:"0.8em"}}>{emptyDepartingMessage}</i></div>

                    }
                </div>
                <div style={{"gridRow":this.props.row+1,"gridColumn":2}} className="carpoolTripContainer">
                    <div className="key">Returning Trip:</div>

                    {props.containingReturning.length ?(
                        <>
                            {
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
                        </>
                    ):
                        <div className="carpoolParticipant"><i style={{color:"grey", fontSize:"0.8em"}}>{emptyReturningMessage}</i></div>
                    }
                </div>

            </div>
        );
    }
}
export default DriverViewCarpool;
