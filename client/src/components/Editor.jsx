import React, { useEffect, useState } from 'react'
import Quill from 'quill'

import 'quill/dist/quill.snow.css'
import { io } from 'socket.io-client';

import { useParams } from 'react-router-dom';

const Editor = () => {
    const toolbarOptions = [
      ["bold", "italic", "underline", "strike"], // toggled buttons
      ["blockquote", "code-block"],
      ["link", "image", "video", "formula"],

      [{ header: 1 }, { header: 2 }], // custom button values
      [{ list: "ordered" }, { list: "bullet" }, { list: "check" }],
      [{ script: "sub" }, { script: "super" }], // superscript/subscript
      [{ indent: "-1" }, { indent: "+1" }], // outdent/indent
      [{ direction: "rtl" }], // text direction

      [{ size: ["small", false, "large", "huge"] }], // custom dropdown
      [{ header: [1, 2, 3, 4, 5, 6, false] }],

      [{ color: [] }, { background: [] }], // dropdown with defaults from theme
      [{ font: [] }],
      [{ align: [] }],

      ["clean"], // remove formatting button
    ];

    const {id} = useParams();

    const [socket, setSocket] = useState();
    const [quill, setQuill] = useState();

useEffect(() => {
  const quillServer = new Quill("#editor", {
    theme: "snow",
    modules: { toolbar: toolbarOptions },
  });
  quillServer.disable();
  quillServer.setText("Loading the document...");
  setQuill(quillServer);
}, []);

useEffect(() => {
  const socketServer = io("https://collaborite.onrender.com");
  setSocket(socketServer);

  return () => {
    socketServer.disconnect();
  };
}, []);

useEffect(() => {
  if (socket === null || quill === null) return;

  const handleChange = (delta, oldData, source) => {
    if (source !== "user") return;

    socket.emit("send-changes", delta);
  };

  quill && quill.on("text-change", handleChange);

  return () => {
    quill && quill.off("text-change", handleChange);
  };
}, [quill, socket]);

useEffect(() => {
  if (socket === null || quill === null) return;

  const handleChange = (delta) => {
    quill.updateContents(delta);
  };

  socket && socket.on("receive-changes", handleChange);

  return () => {
    socket && socket.off("receive-changes", handleChange);
  };
}, [quill, socket]);

useEffect(() => {
  if (quill === null || socket === null) return;

  socket &&
    socket.once("load-document", (document) => {
      quill.setContents(document);
      quill.enable();
    });

  socket && socket.emit("get-document", id);
}, [quill, socket, id]);

useEffect(() => {
  if (socket === null || quill === null) return;

  const interval = setInterval(() => {
    socket.emit("save-document", quill.getContents());
  }, 2000);

  return () => {
    clearInterval(interval);
  };
}, [socket, quill]);
  return (
    <div className="bg-slate-200 flex flex-col items-center pt-10">
      <div className="bg-white w-[60vw] mx-auto min-h-[100vh] shadow-2xl text-black z-2 p-16 mt-14" id="editor"></div>
    </div>
  );
}

export default Editor