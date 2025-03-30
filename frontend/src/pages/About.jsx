import "../../styles/about.css";

const AboutPage = () => {
  return (
    <div className="about-container">
      {/* Hero Section */}
      <header className="hero-section">
        <h1>About SEIF & Sylvia</h1>
        <p>
          Exploring hardware security and verification through augmented symbolic execution.
        </p>
      </header>

      {/* Content Section */}
      <section className="content-section">
        <h2>What is SEIF?</h2>
        <p>
          SEIF (Symbolic Execution for Information Flow) is an advanced framework designed 
          to analyze and verify information flow in hardware designs. It leverages symbolic 
          execution to identify and eliminate false paths while ensuring security properties 
          are upheld.
        </p>

        <h2>What is Sylvia?</h2>
        <p>
          Sylvia is an open-source symbolic execution engine that integrates with SEIF to 
          efficiently explore hardware designs and verify security constraints. It helps 
          overcome the path explosion problem, making hardware verification faster and 
          more scalable.
        </p>
      </section>

      {/* Team Section */}
      <section className="team-section">
        <h2>Meet the Team</h2>
        <div className="team-grid">
          {[
            { name: "Kaki Ryan", role: "Ph.D. Candidate in Computer Science at UNC Chapel Hill, soon to be Assistant Professor; Lead Developer of SEIF and Sylvia" },
            { name: "William Millen", role: "Undergraduate Student and Researcher developing SEIF and Sylvia’s interactive visualization website" },
            { name: "Cynthia Sturton", role: "Professor of Computer Science at UNC Chapel Hill, and Head of the Hardware Security Research Lab at UNC" }
          ].map((person, index) => (
            <div key={index} className="team-card">
              <h3>{person.name}</h3>
              <p>{person.role}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Citation Section */}
      {/* 
      
      */}
      <section className="citation-section">
        <h1>Citations</h1>
        <h2>Sylvia</h2>
        <h3>Github Repository: <a href="https://github.com/HWSec-UNC/Sylvia">Click Here</a></h3>
        <h3>Read the paper: <a href="https://repositum.tuwien.at/bitstream/20.500.12708/188806/1/Ryan-2023-Sylvia%20Countering%20the%20Path%20Explosion%20Problem%20in%20the%20Symbolic%20Ex...-vor.pdf">Click Here</a></h3>
        <p>
          {`
          @inproceedings{Ryan2023Sylvia, author = {Ryan, Kaki and Sturton, Cynthia}, 
          title = {Sylvia: Countering the Path Explosion Problem in the Symbolic Execution of Hardware Designs}, 
          year = {2023}, isbn = {978-3-85448-060-0}, publisher = {TU Wien Academic Press}, address = {New York, NY, USA}, 
          url = {https://repositum.tuwien.at/handle/20.500.12708/188806 }, 
          booktitle = {Proceedings of the 23rd Conference on Formal Methods in Computer-Aided Design (FMCAD)}, 
          pages = {110--121}, numpages = {12}, series = {FMCAD} }
          `}
        </p>
        <h2>SEIF</h2>
        <h3>Read the paper: <a href="https://dl.acm.org/doi/pdf/10.1145/3623652.3623666">Click Here</a></h3>
        <p>
          {`
          @inproceedings{ryan2023SEIF, author = {Ryan, Kaki and Gregoire, Matthew and Sturton, Cynthia}, 
          title = {{SEIF: Augmented} Symbolic Execution for Information Flow in Hardware Designs}, year = {2023}, 
          isbn = {9798400716232}, publisher = {Association for Computing Machinery}, address = {New York, NY, USA}, 
          url = {https://doi.org/10.1145/3623652.3623666}, doi = {10.1145/3623652.3623666}, 
          booktitle = {Proceedings of the 12th International Workshop on Hardware and Architectural Support for Security and Privacy (HASP)}, 
          pages = {1--9}, numpages = {9}, keywords = {path coverage, information flow, symbolic execution, hardware security}, 
          location = {Toronto, Canada}, }
          `}
        </p>
      </section>
    </div>
  );
};

export default AboutPage;

  