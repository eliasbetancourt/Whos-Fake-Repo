

import { howToSteps } from './howToStepsData';

const HowToSteps: React.FC = () => (
  <div style={{ background: 'white', borderRadius: 20, padding: '3vw', marginTop: '3vw', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}>
    <h2 style={{ color: '#333', fontSize: '2rem', marginBottom: '2vw', textAlign: 'center' }}>How to Get Your Instagram Data</h2>
    {/* Steps grid, with last step centered if odd number of steps */}
    {/* Steps grid, last step always centered below */}
    {(() => {
      const steps = howToSteps;
      const lastIdx = steps.length - 1;
      const gridSteps = steps.slice(0, lastIdx);
      const lastStep = steps[lastIdx];
      return (
        <>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '2vw',
              marginTop: '2vw',
              justifyContent: 'center',
              alignItems: 'start',
            }}
          >
            {gridSteps.map((step, idx) => (
              <div key={idx} style={{ textAlign: 'center', padding: '1.5vw' }}>
                <div style={{ margin: '0 auto 1vw', width: 50, height: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', borderRadius: '50%', fontSize: '1.5rem', fontWeight: 'bold', boxShadow: '0 2px 8px rgba(102,126,234,0.08)' }}>
                  {idx + 1}
                </div>
                <h3 style={{ color: '#333', marginBottom: 10, fontSize: '1.2rem' }}>{step.title}</h3>
                <p style={{ color: '#666', fontSize: '0.95rem' }}>{step.text}</p>
              </div>
            ))}
          </div>
          <div style={{ width: '100%', display: 'flex', justifyContent: 'center', marginTop: '2vw' }}>
            <div style={{ textAlign: 'center', padding: '1.5vw', maxWidth: 350, width: '100%', margin: '0 auto' }}>
              <div style={{ margin: '0 auto 1vw', width: 50, height: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', borderRadius: '50%', fontSize: '1.5rem', fontWeight: 'bold', boxShadow: '0 2px 8px rgba(102,126,234,0.08)' }}>
                {steps.length}
              </div>
              <h3 style={{ color: '#333', marginBottom: 10, fontSize: '1.2rem' }}>{lastStep.title}</h3>
              <p style={{ color: '#666', fontSize: '0.95rem' }}>{lastStep.text}</p>
            </div>
          </div>
        </>
      );
    })()}
    {/* Video section (future): YouTube video with optional ad */}
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '2vw' }}>
      {/* TODO: In the future, embed a 15s ad video here, then show the YouTube video below */}
      {/* Example placeholder: */}
      {/* <div style={{ marginBottom: 16, color: '#888' }}>[Ad will play here before the main video]</div> */}
      {/* <iframe width="400" height="225" src="https://www.youtube.com/embed/YOUR_VIDEO_ID" title="YouTube video player" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen></iframe> */}
      {/* <a href="https://youtu.be/your-video-link" target="_blank" rel="noopener noreferrer">Watch video instructions on YouTube</a> */}
    </div>
  </div>
);

export default HowToSteps;
