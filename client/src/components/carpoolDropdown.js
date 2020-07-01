import React, {Component} from "react";

function dropdownBounding(dropdown){
    let rect=dropdown.parentElement.querySelector(".selectorButton").getBoundingClientRect();
    let dwidth=500;
    let windowwidth=document.documentElement.clientWidth;

    let margin=20;
    if(rect.x+dwidth+margin<windowwidth){
        dropdown.style.width=`${dwidth}px`;
        dropdown.style.right=`auto`;
        dropdown.style.left=`auto`;
    }else if(dwidth+2*margin<windowwidth){
        dropdown.style.width=`${dwidth}px`;
        dropdown.style.right=`${margin}px`;
        dropdown.style.left=`auto`;
    }else{
        dropdown.style.width=`auto`;
        dropdown.style.right=`${margin}px`;
        dropdown.style.left=`${margin}px`;
    }
}
class CarpoolDropdown extends Component {
    constructor(props) {
        super(props);
        this.state={
            isOpen: false
        };
        this.selectorDropdown=React.createRef();

        this.resizeListener=()=>{
            if(this.selectorDropdown.current==null)return;
            dropdownBounding(this.selectorDropdown.current);
        }
    }
    componentDidMount() {
        window.addEventListener("resize", this.resizeListener)
        this.resizeListener();
    }
    componentDidUpdate() {
        this.resizeListener();

    }
    componentWillUnmount() {
        window.removeEventListener("resize", this.resizeListener)
    }
    handleClick = (event)=>{
        this.setState({isOpen: true});
    }
    handleHide = (event)=>{
        this.setState({isOpen: false});
    }

    render(){
        let selectedCarpool=this.props.selectedCarpools[this.props.isDepartingTrip?"departing":"returning"];
        let selectedCarpoolName="";
        //0 for waitlist, 1 for parent, 3 for existing carpool.
        switch(selectedCarpool.type){
            case 0:
                selectedCarpoolName="Waitlist";
                break;
            case 1:
                selectedCarpoolName="Parent";
                break;
            case 2:
                selectedCarpoolName="New Carpool";
                break;
            default:
                let carpool=Object.values(this.props.availableCarpools).find((c)=>c.id==selectedCarpool.carpoolId);
                selectedCarpoolName=carpool?carpool.name:"<Invalid carpool>"
                break;
        }
        return(
            <div className="carpoolSelector">
                <button className="selectorButton" onClick={this.handleClick}>
                    {selectedCarpoolName}
                </button>
                {
                    this.state.isOpen?
                    <>
                        <div className="clickDetect" onClick={this.handleHide}></div>
                        <div className="selectorDropdown"  ref={this.selectorDropdown}>
                            <div className="label selectorRow">
                                <div className="carpoolName">Name</div>
                                <div className="carpoolOrigin">Origin</div>
                                <div className="carpoolTime">Time</div>
                            </div>
                            <a className={(selectedCarpool.type==1)?"selectorRow selected":"selectorRow"} onClick={()=>{this.props.selectedCarpoolsChangeHandler(this.props.isDepartingTrip,{type:1,carpoolId:-1});this.handleHide()}}>
                                <div className="carpoolName">Parent</div>
                            </a>
                            {
                                Object.values(this.props.availableCarpools).map((carpoolObj) =>{
                                    let seatsTaken=this.props.isDepartingTrip?carpoolObj.takenDeparting:carpoolObj.takenReturning;
                                    let classes=["selectorRow"];


                                    let realSeats=(this.props.isDepartingTrip?(carpoolObj.trip!=1):(carpoolObj.trip!=0))?carpoolObj.seats:0;
                                    let disabled=seatsTaken>=realSeats;
                                    if(carpoolObj.id==selectedCarpool.carpoolId&&selectedCarpool.type==3)classes.push("selected");
                                    if(disabled)classes.push("disabled");
                                    return(
                                        <a className={classes.join(' ')} key={carpoolObj.id} onClick={disabled?null:()=>{this.props.selectedCarpoolsChangeHandler(this.props.isDepartingTrip,{type:3,carpoolId:carpoolObj.id});this.handleHide()}}>
                                            <div className="carpoolName">{carpoolObj.name}<span className="carpoolCount">{seatsTaken}/{realSeats}</span></div>
                                            <div className="carpoolOrigin">{carpoolObj.origin}</div>
                                            <div className="carpoolTime">{this.props.isDepartingTrip?carpoolObj.departingTime:carpoolObj.returningTime}</div>
                                        </a>
                                    );
                                })
                            }
                            <a className={(selectedCarpool.type==0)?"selectorRow selected":"selectorRow"} onClick={()=>{this.props.selectedCarpoolsChangeHandler(this.props.isDepartingTrip,{type:0,carpoolId:-1});this.handleHide()}}>
                                <div className="carpoolName">Waitlist</div>
                            </a>
                        </div>
                    </>:null
                }
            </div>
        );
    }
}
export default CarpoolDropdown;
