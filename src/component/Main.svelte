<section class="halaman">
  <div class="profile d-flex">
    <div class="kolom1 mt-2 align-content-center">
      <div class="left-profile">
        <div class="introduction">
          <h2>Hi, I am</h2>
          <div class="nama">
            <h1>Andika Hiro Pratama</h1>
            <h3 class="mt-2 caption">College Student</h3>
          </div>
          <div class="d-flex sosmed">
            <a class="kotak" href="https://id.linkedin.com/in/andika-hiro-0881431b1">
              <img src="/img/linkedin.png" alt="linkedin" />
            </a>
            <a class="kotak ms-3" href="https://github.com/andika-hiro">
              <img src="/img/github.png" alt="github" />
            </a>
            <a class="kotak ms-3" href="https://www.instagram.com/hiro_andika21/">
              <img src="/img/instagram.png" alt="instagram" />
            </a>
          </div>
        </div>
      </div>
    </div>

    <div class="kolom2 mt-2">
      <img src="/img/profile.png" class="profile-picture" alt="profile" />
    </div>
  </div>
  <div class="solidbox d-flex">
    <div class="aboutme-page">
      <h2>About Me</h2>
      <p class=" aboutme mt-4">
        Saya adalah mahasiswa S1 Sistem Informasi di Universitas Pembangunan Nasional Jakarta, Saya tertarik dalam bidang pemrograman web lebih khususnya pada bidang frontend developer. Saat ini saya memasuki semester 5 di kampus dan ingin
        mempelajari hal baru karena ilmu tidak akan ada batasnya untuk dipelajari.
      </p>
    </div>
    <div class="logo-page">
      <img src="/img/logo-it.png" class="logoit" alt="logo-it" />
    </div>
  </div>
  <div class="skill d-flex flex-column align-items-center">
    <div class="skill-page">
      <div class="skill-title d-flex flex-column">
        <h4>SKILLS</h4>
      </div>
      <h4 class="spacing-letter margin-top">USING NOW:</h4>
      <div class="logo">
        <div class="logo-skills d-flex flex-column mt-5">
          <img src="/img/html.png" alt="logo-html" />
          <p class="nama-logo ms-2 spacing-letter mt-4">HTML</p>
        </div>

        <div class="logo-skills space-logo d-flex flex-column mt-5">
          <img src="/img/css.png" alt="logo-css" />
          <p class="nama-logo ms-3 spacing-letter mt-4">CSS</p>
        </div>

        <div class="logo-skills space-logo d-flex flex-column mt-5">
          <img src="/img/bootstrap.png" alt="logo-bootstrap" />
          <p class="nama-logo bstrp mt-4">BOOTSTRAP</p>
        </div>

        <div class="logo-skills space-logo d-flex flex-column mt-5">
          <img src="/img/svelte.png" alt="logo-svelte" />
          <p class="nama-logo ms-2 spacing-letter mt-4">SVELTE</p>
        </div>
      </div>
      <div class="margin-top d-flex flex-column align-items-center">
        <img src="/img/seperator.png" alt="seperator" />
      </div>

      <h4 class="spacing-letter margin-top">Learning Now:</h4>
      <div class="logo">
        <div class="logo-skills d-flex flex-column mt-5">
          <img src="/img/JavaScript.png" alt="logo-JavaScript" />
          <p class="nama-logo bstrp mt-4">JAVASCRIPT</p>
        </div>

        <div class="logo-skills space-logo d-flex flex-column mt-5">
          <img src="/img/nodejs.png" alt="logo-nodejs" />
          <p class="nama-logo  spacing-letter mt-4">NODEJS</p>
        </div>

        <div class="logo-skills space-logo d-flex flex-column mt-5">
          <img src="/img/react.png" alt="logo-react" />
          <p class="nama-logo ms-2 spacing-letter mt-4">REACT</p>
        </div>

        <div class="logo-skills space-logo d-flex flex-column mt-5">
          <img src="/img/mongodb.png" alt="logo-mongodb" />
          <p class="nama-logo  spacing-letter mt-4">MONGODB</p>
        </div>
      </div>
    </div>
  </div>
</section>

<style>
  .halaman {
    background-color: #d7d7d7;
  }
  .skill {
    width: 100%;
    height: 1706px;
  }

  .logo-skills {
    width: 98px;
    height: 162px;
  }

  .logo {
    display: flex;
    flex-direction: row;
  }
  .logo-skills:hover {
    transform: scale(1.1);
  }
  .nama-logo {
    font-size: 20px;
  }
  .margin-top {
    margin-top: 97px;
  }
  .spacing-letter {
    letter-spacing: 8px;
  }
  .aboutme {
    font-size: 20px;
    text-align: justify;
    font-weight: 200;
  }
  .skill-page {
    width: 50%;
    margin-top: 125px;
  }
  .space-logo {
    margin-left: 162px;
  }
  .skill-title {
    width: 250px;
    height: 80px;
    border: 6px solid black;
    letter-spacing: 8px;
    padding-left: 50px;
    padding-top: 15px;
    margin-left: 270px;
  }
  .aboutme-page {
    width: 70%;
    margin-left: 50px;
    padding-top: 45px;
    color: #d7d7d7;
  }
  .logo-page {
    width: 40%;
  }
  .profile {
    overflow: hidden;
    height: 650px;
  }
  .bstrp {
    letter-spacing: 3px;
  }
  .kolom1 {
    width: 50%;
  }
  .profile-picture {
    transition: all 0.8s ease-in-out;
  }
  .profile-picture:hover {
    transform: scale(1.1);
  }
  .nama {
    margin-top: 50px;
  }
  .kolom2 {
    width: 50%;
    height: 643px;
    background: linear-gradient(to top, #0e0d12, #212529);
    padding-top: 69px;
    padding-left: 90px;
    overflow: hidden;
  }
  .kotak {
    width: 45px;
    height: 45px;
    background-color: #c4c4c4;
    box-shadow: 2px 1px 0px grey;
    padding-top: 8px;
    padding-left: 8px;
    transition: all 0.4s ease-in-out;
  }
  .kotak:hover {
    background-color: grey;
    transform: scale(1.1);
  }
  .solidbox {
    height: 313px;
    background-color: #1d1d1d;
    overflow: hidden;
  }
  .sosmed {
    margin-top: 80px;
    height: 45px;
    width: 100%;
  }
  h2 {
    font-size: 40px;
    font-weight: 600;
  }
  h3 {
    font-size: 25px;
    font-weight: 500;
  }
  .caption {
    color: #909090;
  }
  h1 {
    font-size: 60px;
    font-weight: 900;
  }
  h4 {
    font-size: 30px;
    font-weight: 900;
  }
  .left-profile {
    height: 20%;
  }
  .introduction {
    margin-left: 10%;
    margin-top: 20%;
  }
  @media screen and (max-width: 1265px) {
    section {
      width: auto;
      float: none;
    }
    .skill {
      flex-direction: column;
      float: left;
      width: 100%;
      background-color: #d7d7d7;
    }

    .logoit {
      width: 0%;
      height: 0%;
    }

    .skill-page {
      width: 100%;
      margin-top: 125px;
      display: flex;
      flex-direction: column;
      align-items: center;
      background-color: #d7d7d7;
    }

    .logo {
      flex-direction: column;
    }
    .skill-title {
      width: 250px;
      height: 80px;
      border: 6px solid black;
      letter-spacing: 8px;
      padding-left: 50px;
      padding-top: 15px;
      margin-left: 0%;
    }

    .space-logo {
      margin: 0%;
    }

    .kolom1 {
      width: 100%;
      padding-top: 10rem;
      padding-left: 1rem;
      display: flex;
      flex-direction: column;
      align-items: center;
      color: white;
    }

    .kolom2 {
      width: 0%;
      height: 0%;
      padding-top: 0%;
      padding-left: 0%;
    }
    .logo-page {
      width: 0%;
    }
    .aboutme {
      font-size: 15px;
      text-align: justify;
      font-weight: 200;
    }
    .solidbox {
      background-color: #1d1d1d;
      height: fit-content;
      padding-bottom: 10%;
      padding-left: 5%;
      overflow: hidden;
    }
    h1 {
      font-size: 35px;
    }
    h2 {
      font-size: 25px;
    }
    h3 {
      font-size: 20px;
    }
    .introduction {
      margin-left: 0%;
      margin-top: 0%;
    }
    .nama {
      margin-top: 30px;
    }

    .profile {
      background-image: url("/img/profile-bg.png");
    }

    .caption {
      color: #c1c1c1;
    }
  }
</style>
