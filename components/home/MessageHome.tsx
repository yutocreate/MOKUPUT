import React, {
  useLayoutEffect,
  useEffect,
  useRef,
  useState,
  createRef,
} from "react";
import { db, auth } from "../../firebase/firebase";
import firebase from "firebase/app";
import anchorme from "anchorme";
import { filterXSS } from "xss";
import { useRouter } from "next/router";
import Router from "next/router";
import Emoji from "../../emojis/emojisComponent";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import classes from "../../styles/home/Homebody.module.scss";
import Avatar from "@mui/material/Avatar";
import UserDetailModal from "./UserDetailModal";
import Button from "@mui/material/Button";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
import TagFacesIcon from "@mui/icons-material/TagFaces";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import NoAuthUserText from "../NoAuthUser/NoAuthUserText";
import NoAuthUserIcon from "../NoAuthUser/NoAuthUser";

interface Props {
  message: {
    uid: string;
    name: string;
    isOnline: boolean;
    avatarURL?: string;
    from: string;
    text: string;
    likes: any;
    replies: any;
    image?: string;
    documentId: string;
    experience?: string;
    useLanguage?: Array<string>;
    willLanguage?: Array<string>;
    createdAt: any;
  };
}

const MessageHome: React.FC<Props> = (props) => {
  const { message } = props;
  const scrollRef = useRef<HTMLDivElement>();
  const editRef = createRef<HTMLInputElement>();
  const [showEmojis, setShowEmojis] = useState<boolean>(false);
  const [openIcon, setOpenIcon] = useState<boolean>(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [edit, setEdit] = useState<boolean>(false);
  const [text, setText] = useState<string>(message.text);
  const [user, setUser] = useState<any>();
  const [openNoAuthUserModal, setOpenNoAuthUserModal] = useState(false);

  const open = Boolean(anchorEl);
  const router = useRouter();
  const channelId: any = router.query.channelId;

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  useEffect(() => {
    scrollRef.current.scrollIntoView({ block: "end" });
  }, [message.text, message.image]);

  useEffect(() => {
    getFirestore();
  }, []);

  const getFirestore = async () => {
    //????????????????????????????????????firestore????????????
    if (auth.currentUser === null) return;
    await db
      .collection("users")
      .doc(auth.currentUser.uid)
      .onSnapshot((snapshot) => {
        setUser(snapshot.data());
      });
  };

  const pickEmoji = (e, { emoji }) => {
    const ref: any = editRef.current;
    ref.focus();
    const start = text.substring(0, ref.selectionStart);
    const end = text.substring(ref.selectionStart);
    const message = start + emoji + end;
    setText(message);
    setShowEmojis(!showEmojis);
  };

  //??????????????????
  const handleShowEmojis = (e): void => {
    e.preventDefault();
    editRef.current.focus();
    setShowEmojis(!showEmojis);
  };

  const handleModalClose = () => setOpenIcon(false);

  //?????????????????????????????????URL???????????????a???????????????
  const htmlText = anchorme({
    input: message.text,
    options: {
      //https://??????????????????????????????????????????????????????
      exclude: (string) => {
        if (!string.startsWith("https://")) {
          return true;
        } else {
          return false;
        }
      },
      attributes: () => {
        const attributes = {
          target: "_blank",
          rel: "noopener noreferrer",
        };
        return attributes;
      },
    },
  });

  //????????????????????????????????????????????????
  const messageDelete = async () => {
    //????????????????????????????????????????????????
    const result = window.confirm("????????????????????????????????????????????????");
    /**???????????????????????????????????? */
    if (result) {
      await db
        .collection("channels")
        .doc(channelId)
        .collection("chat")
        .doc(message.documentId)
        .delete();
    }
    setAnchorEl(null);
  };

  //????????????????????????????????????
  const messageEdit = () => {
    setEdit(true);
    setAnchorEl(null);
  };

  //?????????????????????????????????????????????????????????
  const handleEditCancel = () => {
    setEdit(false);
    setText(message.text);
  };

  //??????????????????firestore???????????????
  const handleEditUpdate = async () => {
    await db
      .collection("channels")
      .doc(channelId)
      .collection("chat")
      .doc(message.documentId)
      .set({ text: text }, { merge: true });
    await setEdit(false);
  };

  const handleLike = async () => {
    if (!message.likes) {
      await db
        .collection("channels")
        .doc(channelId)
        .collection("chat")
        .doc(message.documentId)
        .set(
          {
            likes: firebase.firestore.FieldValue.arrayUnion(
              auth.currentUser.uid
            ),
          },
          { merge: true }
        );
    }

    //???????????????????????????????????????????????????uid??????????????????
    const authLikeUser =
      (await message.likes) &&
      message.likes.find((like) => like === auth.currentUser.uid);

    //uid????????????????????????
    if (message.likes && !authLikeUser) {
      await db
        .collection("channels")
        .doc(channelId)
        .collection("chat")
        .doc(message.documentId)
        .set(
          {
            likes: firebase.firestore.FieldValue.arrayUnion(
              auth.currentUser.uid
            ),
          },
          { merge: true }
        );

      if (message.uid === auth.currentUser.uid) return;
      await db
        .collection("notifications")
        .doc(message.uid)
        .collection("notice")
        .add({
          notification: `${user.name}????????????????????????????????????????????????????????????????`,
          text: text,
          avatarURL: user.avatarURL,
          like: true,
          unread: true,
          channelId,
          uid: user.uid,
          createdAt: firebase.firestore.Timestamp.now(),
        });
    }
    //uid?????????????????????
    else {
      await db
        .collection("channels")
        .doc(channelId)
        .collection("chat")
        .doc(message.documentId)
        .set(
          {
            likes: firebase.firestore.FieldValue.arrayRemove(
              auth.currentUser.uid
            ),
          },
          { merge: true }
        );
    }
  };

  //???????????????????????????????????????
  const handleReplyPage = () => {
    Router.push(`/home/${channelId}/${message.documentId}`);
  };

  const HandleOpenNoAuthUserModal = () => setOpenNoAuthUserModal(true);
  const HandleCloseNoAuthUserModal = () => setOpenNoAuthUserModal(false);

  return (
    <>
      <div className={classes.message_container} ref={scrollRef}>
        <div className={classes.message_info}>
          <Avatar
            src={message && message.avatarURL}
            sx={{
              height: "46px",
              width: "46px",
              borderRadius: "8px",
              cursor: "pointer",
            }}
            onClick={() => setOpenIcon(true)}
          />
          <h4>
            {message.name}
            <span>
              {format(
                new Date(message.createdAt?.toDate()),
                "yyyy???MM???dd??? H:mm",
                { locale: ja }
              )}
            </span>
          </h4>
          <div>
            {auth.currentUser === null ? (
              <div className={classes.no_user_modal_container}>
                <NoAuthUserText name="??????" />
              </div>
            ) : (
              <>
                <Button
                  id="basic-button"
                  aria-controls="basic-menu"
                  aria-haspopup="true"
                  aria-expanded={open ? "true" : undefined}
                  onClick={handleClick}
                  sx={{ fontSize: "14px", marginLeft: "20px" }}
                >
                  ??????
                </Button>
                <Menu
                  id="basic-menu"
                  anchorEl={anchorEl}
                  open={open}
                  onClose={handleClose}
                  MenuListProps={{
                    "aria-labelledby": "basic-button",
                  }}
                >
                  <MenuItem
                    onClick={messageDelete}
                    disabled={auth.currentUser.uid !== message.uid}
                    style={{ color: "rgb(224, 33, 92)" }}
                  >
                    ??????????????????????????????
                  </MenuItem>
                  <MenuItem
                    onClick={messageEdit}
                    disabled={auth.currentUser.uid !== message.uid}
                    style={{ color: "rgb(27, 196, 125)" }}
                  >
                    ??????????????????????????????
                  </MenuItem>
                  <MenuItem onClick={handleReplyPage}>
                    ??????????????????????????????
                  </MenuItem>
                </Menu>
              </>
            )}
          </div>
        </div>
        {message.image && (
          <img src={message.image} alt="??????" className={classes.img} />
        )}
        {edit ? (
          <>
            <TextField
              multiline
              id="js-text"
              autoFocus
              fullWidth
              inputRef={editRef}
              maxRows={20}
              placeholder={"????????????????????????"}
              className={classes.edit_textField}
              value={text}
              name="textarea"
              onChange={(e) => setText(e.target.value)}
            />
            <button
              onClick={handleEditCancel}
              className={classes.cancel_button}
            >
              {" "}
              ???????????????
            </button>
            <button
              onClick={handleEditUpdate}
              className={classes.update_button}
            >
              ?????????????????????
            </button>
            <button
              onClick={handleShowEmojis}
              className={classes.emojiIcon_button}
            >
              <TagFacesIcon color="primary" className={classes.emojiIcon} />
            </button>
            <div
              className={`${classes.emoji} ${!showEmojis && classes.hidden}`}
            >
              <Emoji pickEmoji={pickEmoji} />
            </div>
          </>
        ) : (
          <>
            <p
              className={classes.message_text}
              dangerouslySetInnerHTML={{
                __html: filterXSS(htmlText, {
                  whiteList: {
                    a: ["href", "title", "target", "rel"],
                  },
                }),
              }}
            />
            <div className={classes.sub_function_wrapper}>
              <div>
                {auth.currentUser === null ? (
                  <ChatBubbleOutlineIcon
                    className={`${classes.message_icon}`}
                    onClick={HandleOpenNoAuthUserModal}
                  />
                ) : (
                  <ChatBubbleOutlineIcon
                    className={`${classes.message_icon} ${
                      message.replies &&
                      message.replies > 0 &&
                      classes.count_message_icon
                    }`}
                    onClick={handleReplyPage}
                  />
                )}

                <span>
                  {message.replies && message.replies > 0
                    ? message.replies
                    : ""}
                </span>
              </div>
              <div>
                {auth.currentUser === null ? (
                  <FavoriteBorderIcon
                    className={classes.like_icon}
                    onClick={HandleOpenNoAuthUserModal}
                  />
                ) : (
                  <FavoriteBorderIcon
                    className={`${classes.like_icon} ${
                      message.likes &&
                      message.likes.includes(auth.currentUser.uid) &&
                      classes.selected_icon
                    }`}
                    onClick={handleLike}
                  />
                )}
                <span>
                  {message.likes && message.likes.length > 0
                    ? message.likes.length
                    : ""}
                </span>
              </div>
            </div>
          </>
        )}
        <NoAuthUserIcon
          openNoAuthUserModal={openNoAuthUserModal}
          HandleCloseNoAuthUserModal={HandleCloseNoAuthUserModal}
        />
        <UserDetailModal
          handleClose={handleModalClose}
          message={message}
          open={openIcon}
        />
      </div>
    </>
  );
};

export default MessageHome;
