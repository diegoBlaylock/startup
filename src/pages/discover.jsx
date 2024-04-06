import React, { useEffect, useState } from 'react'
import { Header, HeaderActionType } from './frame/header'
import { Footer } from './frame/footer'
import { Authenticator } from './shared/validate-token.js'
import './discover.css'

import {Search, Filter, RoomRequest} from "../endpoints/request.js"
import {discoverRooms} from "../endpoints/api.js"
import { NavLink} from 'react-router-dom'

export function DiscoverPage () {
    const [rooms, setRooms] = useState();

    async function loadRooms(page) {
        const [search_type, search_param, filter_type] = getSearchFilterParameters();
        const request = new RoomRequest(page, filter_type, search_type, search_param);
    
        try {
            const response = await discoverRooms(request);
            setRooms(response);
        } catch(e) {
            console.log(e);
        }
    }

    useEffect(()=>{
        loadRooms();
    }, []);

    return (
        <div id="body">
            <Authenticator/>
            <Header headerType={HeaderActionType.PROFILE}/>
            <nav id="discover_nav">
                <menu>
                    <li><NavLink className="selected">Discover Rooms</NavLink></li>
                    <li><NavLink to="/create/room">Create a Room</NavLink></li>
                </menu>
            </nav>
            <main id="discover_main">
                <div id="roomspage">
                    {rooms?.rooms?.map((room, i)=><RoomCard room={room} key={i}/>)}
                </div>
                <PageBar num={rooms?.num??0} total={rooms?.total??0} />
            </main>
            <div id="search_bar">
                <div id="search">
                    <label>Search by:</label>
                    <select id="search_type" title="How to search by." onChange={()=> {
                        if(document.getElementById("search_param").value) loadRooms()
                    }}>
                        <option>user</option>
                        <option>room</option>
                    </select>
                    <input id="search_param" type="text" placeholder="Type and press Enter" autoComplete="off" onKeyUp={(event)=> {
                        if(event.key === "Enter") loadRooms();    
                    }}/>
                </div>    
                <div id="filter">
                    <label>Filter by:</label>
                    <select id="filter_type" title="Choose how to Filter." onChange={()=> loadRooms()}>
                        <option defaultValue={true}>time playing</option>
                        <option>popularity</option>
                    </select>
                </div>    
            </div>
            <Footer />
        </div>
    )
}

function RoomCard({room}) {
    const url = new URL("/room",window.location.origin);
    url.searchParams.append("roomID", room._id);
    const path = url.pathname+url.search;   
    
    return (
        <NavLink to={path} className='room-desc' data-id={room._id}>
            <h2 title={room.description}>{room.title}</h2>
            <img className='profile-pic profile-inv' src={room.owner.profile} draggable="false"/>
            <label title={room.owner.description}>by <span className='username'>{room.owner.username}</span></label>
        </NavLink>
    );
}

function PageBar({num, total}) {
    let range;
    if(total <= 5 || num < 2) {
        range = [1, Math.min(5, total)];
    } else if(num+2 >= total) {
        range = [total - 4, total];
    } else {
        range = [num - 1, num + 3];
    }
    const links = [];
    if (range[0] > 1) links.push("…");
    for(let i = range[0]; i <= range[1]; i++) {
        links.push(
            <a 
                key={i}
                data-page={i.toString()} 
                className={i-1 === num? 'selected-page disabled':null}
                onClick={i-1 !== num? changePage: null}
            >{i.toString()}</a>
        );
    }
    if (range[1] < total) links.push("…");
      
    return <div className="pagebar">{links}</div>
}

function changePage(el) {
    const page = parseInt(this.dataset.page??"1") - 1;
    loadRooms(page);
}

function getSearchFilterParameters() {
    let search_type = document.getElementById("search_type").value;
    let search_param = document.getElementById("search_param").value;
    let filter_type = document.getElementById("filter_type").value;

    search_type = (search_type === "user")? Search.USER : Search.ROOM;
    filter_type = (filter_type === "popularity")? Filter.POPULARITY : Filter.TIME_STAMP;

    return [search_type, search_param, filter_type];
}
