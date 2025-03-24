import Head from "next/head";
import Image from "next/image";
import Link from "next/link";

import 'styles/index.css';
import 'styles/bulma.css';

export default function Home() {
  return (
    <>
      <Head>
        <title>Yapp</title>
        <link rel="stylesheet" href="/bulma.css" />
        <link rel="stylesheet" href="/index.css" />
        <link
          href="https://fonts.googleapis.com/css2?family=Ga+Maamli&family=Love+Light&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Nunito:wght@300;400;600;700&display=swap"
          rel="stylesheet"
        />
        <link rel="shortcut icon" href="/images/logoY.png" />
      </Head>

      <nav className="navbar is-primary custom-navbar" role="navigation" aria-label="main navigation">
        <div className="navbar-brand">
          <Image src="/images/logotext.png" alt="Logo" width={150} height={50} className="logo-image" />
          <button className="navbar-burger" aria-label="menu" aria-expanded="false">
            <span aria-hidden="true"></span>
            <span aria-hidden="true"></span>
            <span aria-hidden="true"></span>
          </button>
        </div>

        <div id="navbarMenu" className="navbar-menu">
          <div className="navbar-center is-flex is-justify-content-center" style={{ flexGrow: 1 }}>
            <Link className="navbar-item custom-font" href="#">Home</Link>
            <Link className="navbar-item custom-font" href="#">Account</Link>
            <Link className="navbar-item custom-font" href="#">Messaging</Link>
            <Link className="navbar-item custom-font" href="#">Upload Post</Link>
            <Link className="navbar-item custom-font" href="#">Search</Link>
          </div>

          <div className="navbar-end">
            <div className="navbar-item">
              <div className="buttons">
                <Link className="button is-light" href="#">Log in</Link>
                <Link className="button is-link custom-button" href="#">Sign up</Link>
              </div>
            </div>
          </div>
        </div>
      </nav>~

      <main className="container post-container">
        <Post title="Post Title" imageSrc="https://via.placeholder.com/400x225" description="This is a brief description of the post." />
        <Post title="Post Title" imageSrc="https://via.placeholder.com/400x225" description="This is a brief description of the post." />
      </main>
    </>
  );
}

const Post = ({ title, imageSrc, description }) => (
  <div className="box post-box">
    <h2 className="title is-5 mt-3">{title}</h2>
    <figure className="image is-16by9 post-image">
      <Image src={imageSrc} alt="Post Image" width={400} height={225} />
    </figure>
    <p className="content">{description}</p>
  </div>
);