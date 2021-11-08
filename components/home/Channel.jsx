import React from 'react'
import classes from '../../styles/home/Channel.module.scss'
import Router from 'next/router'
import {useRouter} from 'next/router'




const Channel = (props) => {
  const {doc, selectedChannel} = props

  return (
    <>
    <div className={classes.channel_container}  onClick={() => selectedChannel(doc)}>
      <h3><span>#</span>{doc.name}</h3>
    </div>
    </>
  )
}

export default Channel