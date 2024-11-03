'use client'
import React, { useContext, useEffect, useRef, useState } from 'react';
import {  OverlayTrigger, Tooltip } from 'react-bootstrap'
import './chatbot.css';
import Lottie from 'react-lottie-player';
import axios from 'axios';
import { Image } from '@chakra-ui/react';
import {  auth } from '@/config/firebase';
import Data from './Animation.json'
import { DecryptCookie } from '@/function/cookiesFunctions';
import handleTokenSave from '@/function/tokenFunction';
import { CustomToast } from '@/Components/myToast';
import Cookies from 'js-cookie';
import handleGetAllRoutes from '@/function/getRoutes';
import { UserContext } from '@/store/context/UserContext';
import ReactMarkdown from 'react-markdown'
import { usePathname } from 'next/navigation';

const ChatbotIcon = () => {
    const renderTooltip = (props) => (
        <Tooltip  {...props}>
            <div style={{ backgroundColor: 'black', padding: '5px', fontSize: '12px', margin: '10px' }}> Need help? Try AIIQ Chat Support</div>
        </Tooltip>
    );

    return (
        <OverlayTrigger
            delay={{ show: 250, hide: 400 }}
            overlay={renderTooltip}
            placement="top"
        >
            <Image src='/chatbot/aiiq_icon.png' />
            {/* <img src={CHATBOTICON} alt='Chatbot Icon' /> */}
        </OverlayTrigger>

    )
}

function Bot({ url }) {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [toggleSize, setToggleSize] = useState(false)
    const chatContainerRef = useRef(null);
    const [historySessions, setHistorySessions] = useState([])
    const [viewChat, setViewChat] = useState(false)
    const [viewHistory, setViewHistory] = useState(false)
    const [sessions, setSessions] = useState([])
    const [showEndConfirmation, setShowEndConfirmation] = useState(false)
    const [loading, setLoading] = useState(false)
    const { addToast } = CustomToast()
    const { state: UserState } = useContext(UserContext)
    const [currentID, setCurrentID] = useState("");


    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [messages]);

    useEffect(() => {
        if (url)
            handleEndSession()
            // fetchData()
    }, [url])

    const fetchData = async () => {
        try {
            await axios.get(`${url}/get_llm_params/`)
                .then((response) => {
                    setMessages([{
                        'by': 'ai',
                        'msg': response.data.greeting
                    }])
                })
        } catch (e) {
            console.log(e.message)
            setMessages([{
                'by': 'ai',
                'msg': 'Got into error'
            }])
        }
    }


    const toggleChatbot = () => {
        setIsOpen(!isOpen);
    };

    async function handleEndSession() {

        // document.cookie = "flask-session-aiiq=; expires=2023-01-01; path=/; secure; SameSite=None;";
        setViewChat(false)
        setHistorySessions([])
        setViewHistory(false)
        setSessions([])
        setShowEndConfirmation(false)
        // toggleChatbot()
        try {
            axios.post(`${url}/end-session`)
                .then(async (response) => {
                    // console.log(response.data)
                    setCurrentID(response.data?.id)
                    // const session = Cookies.get("aiiq_admin_panel_session")
                    // const key = DecryptCookie(session)
                    // const parse = JSON.parse(key);
                    // const db = getFirestore(app, 'aiiq-engine');
                    // let list1 = [];
                    // list1 = await handleGetAllRoutes()
                    // const filteredArray = list1.filter((item) =>
                    //     pathname.includes(item.name)
                    // );
                    // await handleTokenSave(parse.token, parse.email, filteredArray[0].value);
                    fetchData()
                })
        } catch (error) {
            console.log(error)
            addToast({ message: `/end-session: ${error.message}`, type: "error" });

        }

    }


    const handleSend = async (text) => {

        if (UserState.value.data.email) {

            let userInput = text
            let userName = UserState.value.data.email;
            let session_id = currentID
            try {
                const requestOptions = {
                    method: 'POST',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*',
                    },
                    body: JSON.stringify({ userInput, userName, session_id })
                };
                await fetch(`${url}/query`, requestOptions)
                    .then(response => response.json())
                    .then(data => {
                        setMessages((prevMessages) => {
                            const newState = [...prevMessages]
                            newState.pop()
                            newState.push({
                                'by': 'ai',
                                'msg': data.response
                            })
                            return newState
                        })
                    })
            } catch (error) {
                console.log(error)
                const pathname = usePathname()
                const session = Cookies.get("aiiq_admin_panel_session");
                const key = DecryptCookie(session);
                const parse = JSON.parse(key);
                let allRoutes = []
                allRoutes = await handleGetAllRoutes()
                const filteredArray = allRoutes.filter((item) =>
                  pathname.toLowerCase().includes(item.name.toLowerCase())
                );
                await handleTokenSave(
                  parse.token,
                  parse.email,
                  filteredArray[0].value
                );
                setMessages((prevMessages) => {
                    const newState = [...prevMessages]
                    newState.pop()
                    newState.push({
                        'by': 'ai',
                        'msg': "Please send query again"
                    })
                    return newState
                })

            } finally {
                // setLoading(false)
            }

        }


    };


    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (input.trim()) {
                const text = input;
                setInput('')
                setMessages((prevMessages) => {
                    const newState = [...prevMessages]
                    newState.push({
                        'by': 'user',
                        'msg': text
                    })
                    newState.push({
                        by: 'ai',
                        msg: 'loading'
                    })
                    return newState
                })
                handleSend(text)
            }
        }
    };

    async function handleHistory() {
        const userEmail = auth?.currentUser?.email
        if (userEmail) {
            try {
                await axios.post(`${url}/get-user-sessions`, {
                    userName: userEmail
                }, {
                    headers: {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*',
                    },
                })
                    .then((response) => {
                        if (response.data.sessions) {
                            setSessions(response.data.sessions)
                        }
                    })
            } catch (e) {
                console.log(e)
                // setMessages([{
                //     'by': 'ai',
                //     'msg': 'Got into error'
                // }])
            } finally {
                setLoading(false)
            }
        }

    }

    async function handleSelectedSession(data) {
        setHistorySessions(data)
    }

    return (
        currentID &&
        url ?
            messages.length == 0
                ?
                null
                :
                <div className={`chatbot-container ${isOpen ? 'open' : ''}`}>
                    {!isOpen && (
                        <div className="chatbot-icon" onClick={toggleChatbot}>
                            <ChatbotIcon />
                        </div>
                    )}
                    {isOpen && (
                        <div className={toggleSize ? "chatbot-window-big" : "chatbot-window"}>
                            <div className="chatbot-header">
                                <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
                                    {
                                        viewHistory ?
                                            viewChat ?
                                                <button style={{ width: '30px' }} onClick={() => setViewChat(false)} className='header-icon'>
                                                    <Image style={{ width: '15px', height: '15px' }} src='/chatbot/back_icon.png' />
                                                    {/* <img style={{ width: '15px', height: '15px' }} src={BACKICON} /> */}
                                                </button>
                                                :
                                                <button style={{ width: '30px' }} onClick={() => {
                                                    setViewHistory(false)
                                                    setSessions([])
                                                }} className='header-icon'>
                                                    <Image style={{ width: '15px', height: '15px' }} src='/chatbot/back_icon.png' />
                                                    {/* <img style={{ width: '15px', height: '15px' }} src={BACKICON} /> */}
                                                </button>
                                            :
                                            <button onClick={() => {
                                                setLoading(true)
                                                setViewHistory(true)
                                                handleHistory()
                                            }} className='history-icon'>
                                                <Image style={{ width: '15px', height: '15px' }} src='/chatbot/history_icon.png' />
                                                {/* <img style={{ width: '20px', height: '20px' }} src={HISTORYICON} /> */}
                                            </button>
                                    }
                                    <div style={{ fontSize: '14px', marginLeft: '5px' }}>
                                        SL Chatbot powered by AiiQ
                                    </div>

                                </div>
                                <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
                                    <button onClick={toggleChatbot} className='header-icon'>
                                        <Image style={{ width: '15px', height: '15px' }} src='/chatbot/minimize1_icon.png' />
                                        {/* <img style={{ width: '15px', height: '15px' }} src={MINIMIZE1ICON} /> */}
                                    </button>
                                    <button onClick={() => setToggleSize(!toggleSize)} className='header-icon' >
                                        <Image style={{ width: '15px', height: '15px' }} src={toggleSize ? '/chatbot/minimize_icon.png' : '/chatbot/maximize_icon.png'} />
                                        {/* <img style={{ width: '15px', height: '15px' }} src={toggleSize ? MINIMIZEICON : MAXIMIZEICON} /> */}
                                    </button>
                                    <button onClick={() => setShowEndConfirmation(true)} className='header-icon'>
                                        <Image style={{ width: '15px', height: '15px' }} src={'/chatbot/cross_icon.png'} />

                                        {/* <img style={{ width: '15px', height: '15px' }} src={CROSSICON} /> */}
                                    </button>
                                </div>
                            </div>
                            {viewHistory ?
                                viewChat ?
                                    historySessions.length > 0
                                        ?
                                        <div className="chatbot-body" >
                                            {historySessions.map((message, index) => (
                                                message.role == 'ai'
                                                    ?
                                                    <div key={index} className={`message-container-ai`}>
                                                        <div className='ai-div-container'>
                                                            <Image className='ai-img' src={'/chatbot/aiiq_icon.png'} />

                                                            {/* <img className='ai-img' src={CHATBOTICON} /> */}
                                                        </div>
                                                        <div className='message-ai'>
                                                        <div className="markdown">
                                                        <ReactMarkdown>
                                                            {message.content}
                                                            </ReactMarkdown>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    : message.role == 'query'
                                                        ?
                                                        <div key={index} className={`message-container-user`}>
                                                            <div className='message-user'>
                                                                {message.content}
                                                            </div>
                                                            <div className='user-div-container'>
                                                                <Image className='user-img' src={'/chatbot/user.svg'} />
                                                                {/* <img className='user-img' src={USERICON} /> */}
                                                            </div>
                                                        </div>
                                                        : null
                                            ))}
                                        </div>
                                        : null
                                    :
                                    <div className="chatbot-body" >
                                        {
                                            loading ?
                                                <Lottie
                                                    loop
                                                    animationData={Data}
                                                    play
                                                    style={{ width: '200px', }}
                                                />
                                                :
                                                sessions.length > 0 ?
                                                    sessions.map((session_ID, index) => (
                                                        session_ID.headline &&
                                                        <div key={index} className='history-sessions'>
                                                            <div onClick={() => {
                                                                setHistorySessions([])
                                                                setViewChat(true)
                                                                handleSelectedSession(session_ID.data)
                                                            }} style={{ fontSize: '13px', fontWeight: '500', }}>
                                                                {session_ID.headline}
                                                            </div>
                                                        </div>
                                                    ))
                                                    : <div>
                                                        No Data found
                                                    </div>}
                                    </div>
                                :
                                <div className="chatbot-body" ref={chatContainerRef}>
                                    {messages.map((message, index) => (
                                        message.by == 'ai'
                                            ?
                                            message.msg == 'loading' ?
                                                <Lottie
                                                    key={index}
                                                    loop
                                                    animationData={Data}
                                                    play
                                                    style={{ width: '100px', }}
                                                />
                                                :
                                                <div key={index} className={`message-container-${message.by}`}>
                                                    <div className='ai-div-container'>
                                                        <Image className='ai-img' src={'/chatbot/aiiq_icon.png'} />
                                                        {/* <img className='ai-img' src={CHATBOTICON} /> */}
                                                    </div>
                                                    <div className='message-ai'>
                                                        <div className="markdown">
                                                            <ReactMarkdown>
                                                                {message.msg}
                                                            </ReactMarkdown>
                                                        </div>
                                                    </div>
                                                </div>
                                            :
                                            <div key={index} className={`message-container-${message.by}`}>
                                                <div className='message-user'>
                                                    {message.msg}
                                                </div>
                                                <div className='user-div-container'>
                                                    <Image className='user-img' src={'/chatbot/user.svg'} />
                                                    {/* <img className='user-img' src={USERICON} /> */}
                                                </div>
                                            </div>
                                    ))}
                                </div>
                            }

                            <div className="chatbot-footer">
                                {showEndConfirmation ?
                                    <div className='end-chat'>
                                        <div style={{ color: 'black' }}>
                                            End Chat?
                                        </div>
                                        <button className='history-icon' style={{ width: '100px' }} onClick={() => handleEndSession()}>
                                            Yes
                                        </button>

                                        <button className='history-icon' style={{ width: '100px' }} onClick={() => setShowEndConfirmation(false)}>
                                            No
                                        </button>

                                    </div>
                                    :
                                    viewHistory ? null :
                                        <>
                                            <textarea
                                                disabled={messages[messages.length - 1]?.msg === "loading"}
                                                className='textStyle'
                                                value={input}
                                                onChange={(e) => setInput(e.target.value)}
                                                placeholder="Type your message..."
                                                onKeyDown={handleKeyDown}
                                            />
                                            <Image onClick={() => {
                                                if (input.trim()) {
                                                    const text = input
                                                    setInput('')
                                                    setMessages((prevMessages) => {
                                                        const newState = [...prevMessages]
                                                        newState.push({
                                                            'by': 'user',
                                                            'msg': text
                                                        })
                                                        newState.push({
                                                            by: "ai",
                                                            msg: "loading",
                                                        });
                                                        return newState
                                                    })
                                                    handleSend(text)
                                                }

                                            }} style={{ height: '30px', width: '30px', marginRight: '10px', marginLeft: '10px' }} src={'/chatbot/send_icon.png'} />
                                        </>
                                }

                            </div>


                        </div>
                    )}
                </div>
            : null
    );
}

export default Bot;
