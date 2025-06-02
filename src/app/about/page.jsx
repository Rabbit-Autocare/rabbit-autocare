import FirstSection from '@/components/about/FirstSection'
import MeetFounder from '@/components/about/MeetFounder'
import MissionVision from '@/components/about/MissionVision'
import WhyChooseus from '@/components/about/WhyChooseus'

import React from 'react'

function page() {
  return (
    <div>
      <FirstSection/>
      <MissionVision/>
      <MeetFounder/>
      <WhyChooseus/>
    </div>
  )
}

export default page