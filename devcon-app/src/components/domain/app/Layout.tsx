import React, { PropsWithChildren, useState, useEffect, useRef, RefObject, ReactNode } from 'react'
import css from './app.module.scss'
import AppIcon from 'assets/icons/app-icons-1.svg'
import TilesIcon from 'assets/icons/dc-7/tiles.svg'
import TilesFillIcon from 'assets/icons/dc-7/tiles-fill.svg'
import SpeakerIcon from 'assets/icons/dc-7/speaker.svg'
import SpeakerFillIcon from 'assets/icons/dc-7/speaker-fill.svg'
import ScheduleIcon from 'assets/icons/dc-7/schedule.svg'
import ScheduleFillIcon from 'assets/icons/dc-7/schedule-fill.svg'
// import CalendarFillIcon from 'assets/icons/calendar-fill.svg'
// import TilesIcon from 'assets/icons/app-tiles.svg'
import cn from 'classnames'
import { usePathname, useRouter } from 'next/navigation'
import AppIcons from 'assets/icons/app-icons.svg'
import ThreeDotsIcon from 'assets/icons/three-dots.svg'
import UserIcon from 'assets/icons/dc-7/account.svg'
import UserFillIcon from 'assets/icons/dc-7/account-fill.svg'
import Link from 'next/link'
import { motion, useScroll, useTransform, MotionValue } from 'framer-motion'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useRecoilState } from 'recoil'
import ChevronRightIcon from 'assets/icons/chevron_right.svg'
import { devaBotVisibleAtom, selectedSessionAtom, sessionIdAtom, useSeenNotifications } from 'pages/_app'
import { useAccountContext } from 'context/account-context'
import IconVenue from 'assets/icons/dc-7/event.svg'
import IconFilledVenue from 'assets/icons/dc-7/event-fill.svg'
import ArrowBackIcon from 'assets/icons/arrow_left.svg'
import { selectedSpeakerAtom } from 'pages/_app'

type HeaderProps = {
  breadcrumbs: {
    label: string
    render?: () => React.ReactNode
    href?: string
    icon?: any
    onClick?: () => void
  }[]
  renderActions?: () => React.ReactNode
  pageTitle: string
}

const LocationInformation = ({
  className,
  textColor,
  renderActions,
}: {
  className: string
  textColor?: MotionValue<string>
  renderActions?: () => React.ReactNode
}) => {
  const [countdown, setCountdown] = useState('')
  const [currentTime, setCurrentTime] = useState('')

  useEffect(() => {
    const targetDate = new Date('2024-11-12T09:00:00+07:00') // Bangkok time (UTC+7)

    const updateCountdown = () => {
      const now = new Date()
      const difference = targetDate.getTime() - now.getTime()

      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24))
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60))
        // const seconds = Math.floor((difference % (1000 * 60)) / 1000)

        setCountdown(`T-${days}d ${hours}h ${minutes}m`) // ) //  ${seconds}s`)
      } else {
        setCountdown('Event started!')
      }
    }

    const updateCurrentTime = () => {
      const now = new Date()
      const bangkokTime = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Bangkok',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      }).format(now)
      setCurrentTime(bangkokTime + ' Bangkok (GMT+7)')
    }

    updateCountdown() // Initial call
    updateCurrentTime() // Initial call
    const timer = setInterval(updateCountdown, 60000) // Update every minute
    const timeTimer = setInterval(updateCurrentTime, 60000) // Update every minute

    return () => {
      clearInterval(timer)
      clearInterval(timeTimer)
    } // Cleanup on unmount
  }, [])

  return (
    <div className={className}>
      {/* <div className="flex items-center justify-center gap-2">
        <Image src={SunCloudy} alt="sun-cloudy" width={24} height={24} />
        <div className="text-lg font-semibold">32°C</div>
      </div> */}
      {!renderActions && (
        <div className="flex gap-4 text-sm font-semibold">
          <div>{currentTime}</div>
          {/* <div>{countdown}</div> */}
          {/* <motion.div
          className="text-[#000000] text-[13px] font-semibold header-color"
          style={{ color: textColor || '#000000' }}
        >
          {currentTime}
        </motion.div>
        <motion.div
          className="text-[#000000] text-[13px] font-semibold header-color"
          style={{ color: textColor || '#000000' }}
        >
          {countdown}
        </motion.div> */}
        </div>
      )}
    </div>
  )
}

const BackButton = () => {
  const router = useRouter()
  const pathname = usePathname()
  const [sessionId, setSessionId] = useRecoilState(sessionIdAtom)

  useEffect(() => {
    if (history.state.key && !sessionId) {
      setSessionId(history.state.key)

      return
    }
  }, [sessionId, setSessionId])

  const canBack = typeof window !== 'undefined' && history.state?.key !== sessionId

  const handleBackClick = () => {
    if (canBack) {
      router.back()
    } else {
      router.push('/')
    }
  }

  if (!sessionId) return null

  return (
    <div
      className={cn(
        'lg:w-[30px] flex w-[20px] justify-start items-center text-xl shrink-0 transition-all duration-300',
        canBack && 'hover:scale-110'
      )}
    >
      {canBack ? (
        <button onClick={handleBackClick} className="flex items-center cursor-pointer select-none">
          <ArrowBackIcon
            style={{
              fontSize: 16,
              // transform: 'rotateY(180deg)', // Apply 180-degree rotation on the X-axis
            }}
          />
        </button>
      ) : (
        <AppIcon style={{ fontSize: 20 }} />
      )}
    </div>
  )
}

const Header = (props: HeaderProps) => {
  const { scrollY } = useScroll({
    layoutEffect: false,
  })
  const opacity = useTransform(scrollY, [0, 50], [0, 1])
  // const opacityOut = useTransform(scrollY, [0, 50], [1, 0])
  const textColor = useTransform(scrollY, [0, 50], ['#000000', '#000000'])

  return (
    <>
      {/* <div
        className="fixed top-0 w-screen left-0 header-gradient z-[100]"
        style={{ height: 'calc(0px + max(0px, env(safe-area-inset-top)))' }}
      ></div> */}
      <motion.div
        className={cn('section z-[12] sticky top-0 max-w-[100vw]')}
        data-type="header"
        style={{
          color: textColor,
          // @ts-ignore
          '--color-icon': textColor,
          paddingTop: 'calc(0px + max(0px, env(safe-area-inset-top)))',
        }}
      >
        <div className="flex justify-between items-center min-h-[56px] w-full gap-4 lg:gap-4">
          <motion.div
            className="absolute hidden lg:block inset-0  self-center left-0 w-screen h-full glass z-[-1]"
            style={{ opacity }}
          ></motion.div>
          <motion.div
            className="absolute lg:hidden inset-0 header-gradient self-center shadow-lg left-0 w-screen h-full z-[-1]"
            style={{ opacity }}
          ></motion.div>
          <BackButton />
          {/* <div className="md:hidden lg:w-[30px] flex w-[20px] justify-start items-center text-xl shrink-0">
            <AppIcon style={{ fontSize: 20 }} />
          </div> */}

          <div className="flex gap-6 items-center grow line-clamp-1 shrink-0">
            {/* <div className="text-2xl">{props.pageTitle}</div> */}

            <div className="flex items-center gap-1.5 text-lg lg:text-base overflow-hidden">
              {/* <SpeakerIcon style={{ fontSize: 20 }} /> */}
              {/* <div className="text-2xl">{props.pageTitle}</div> */}
              {props.breadcrumbs.map((breadcrumb, index) => (
                <React.Fragment key={breadcrumb.label}>
                  <div
                    className={cn(
                      'font-semibold shrink-0',
                      index === props.breadcrumbs.length - 1 ? 'line-clamp-1' : ''
                    )}
                    style={{
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {breadcrumb.render ? breadcrumb.render() : breadcrumb.label}
                  </div>
                  {index < props.breadcrumbs.length - 1 && (
                    <ChevronRightIcon className="shrink-0 icon" style={{ fontSize: 8 }} />
                  )}
                </React.Fragment>
              ))}
            </div>

            {/* <Breadcrumb className="flex">
              <BreadcrumbList className="lg:text-sm">
                {props.breadcrumbs.map((breadcrumb, index) => {
                  let label = breadcrumb.label as any

                  if (breadcrumb.icon) {
                    label = <breadcrumb.icon className="icon" />
                  }

                  return (
                    <React.Fragment key={index}>
                      <BreadcrumbItem>
                        {breadcrumb.href ? (
                          <BreadcrumbLink href={breadcrumb.href} className="cursor-pointer">
                            {index === props.breadcrumbs.length - 1 ? (
                              <span className="font-semibold flex items-center">{breadcrumb.label}</span>
                            ) : (
                              label
                            )}
                          </BreadcrumbLink>
                        ) : (
                          <span
                            onClick={breadcrumb.onClick}
                            className={cn(
                              index === props.breadcrumbs.length - 1 ? 'flex items-center' : 'flex items-center',
                              breadcrumb.onClick && 'cursor-pointer'
                            )}
                          >
                            {label}
                          </span>
                        )}
                      </BreadcrumbItem>
                      {index < props.breadcrumbs.length - 1 && <BreadcrumbSeparator />}
                    </React.Fragment>
                  )
                })}
              </BreadcrumbList>
            </Breadcrumb> */}
          </div>
          <div className="flex items-center justify-center gap-6">
            {!props.renderActions && (
              <LocationInformation className="hidden sm:flex items-center justify-center gap-6" />
            )}

            {props.renderActions && props.renderActions()}

            <div className="flex hidden items-center justify-center gap-4 ml-4 user-select-none">
              {/* <Link href="/login">
                <BellIcon
                  className="cursor-pointer hover:scale-110 transition-transform duration-300 icon !flex items-center justify-center"
                  style={{ width: 18, height: 18 }}
                />
              </Link>

              <Link href="/login">
                <UserIcon
                  className="cursor-pointer hover:scale-110 transition-transform duration-300 icon !flex items-center justify-center"
                  style={{ width: 18, height: 18 }}
                />
              </Link> 
              <ThreeDotsIcon
                className="cursor-pointer hover:scale-110 transition-transform duration-300 icon !flex items-center justify-center"
                style={{ width: 18, height: 18 }}
              /> */}
            </div>
          </div>
        </div>
      </motion.div>
      {/* <LocationInformation
        // textColor={textColor}
        className="flex md:hidden items-center justify-between px-5 gap-6 py-2 z-[11] relative"
      /> */}
    </>
  )
}

const navItems = (isLoggedIn: boolean, pathname: string) => [
  {
    icon: pathname === '/' ? TilesFillIcon : TilesIcon,
    label: 'Dashboard',
    href: '/',
    size: 17,
  },
  {
    label: 'Schedule',
    icon: pathname === '/schedule' ? ScheduleFillIcon : ScheduleIcon,
    href: '/schedule',
    size: 18,
  },
  {
    label: 'Speakers',
    icon: pathname === '/speakers' ? SpeakerFillIcon : SpeakerIcon,
    href: '/speakers',
    size: 18,
  },
  {
    label: 'Event',
    icon: pathname === '/event' ? IconFilledVenue : IconVenue,
    href: '/event',
    isActive: pathname.startsWith('/event'),
    size: 18,
  },
  {
    icon: pathname.startsWith('/account') ? UserFillIcon : UserIcon,
    label: isLoggedIn ? 'Account' : 'Log In',
    href: isLoggedIn ? '/account' : '/login',
    isActive: pathname.startsWith('/account'),
    size: 22,
  },
]

export const useWindowWidth = () => {
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 0)

  useEffect(() => {
    if (typeof window === 'undefined') return

    const handleResize = () => setWindowWidth(window.innerWidth)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return windowWidth
}

const Navigation = () => {
  const accountContext = useAccountContext()
  const pathname = usePathname()
  const [openPopover, setOpenPopover] = useState<string | null>(null)
  const windowWidth = useWindowWidth()
  const isSmallScreen = windowWidth < 1280
  const [_, setDevaBotVisible] = useRecoilState(devaBotVisibleAtom)
  const { notificationsCount } = useSeenNotifications()
  const [selectedSpeaker, setSelectedSpeaker] = useRecoilState(selectedSpeakerAtom)

  return (
    <div
      className={cn(
        'self-start flex items-end justify-center shrink-0 gap-4 user-select-none h-full fixed bottom-0 left-0 grow-0 w-full z-[14] pointer-events-none',
        'xl:order-1 xl:justify-start xl:w-[0px] xl:flex-col xl:left-auto xl:relative xl:items-center'
      )}
      style={{
        paddingBottom: 'calc(0px + max(16px, env(safe-area-inset-bottom)))',
      }}
    >
      <div
        className="flex md:hidden absolute left-0 bottom-0 w-full bottom-glass"
        style={{ height: 'calc(72px + max(16px, env(safe-area-inset-bottom)))' }}
      ></div>
      <div className="sticky top-[80px] flex gap-4 flex-row xl:flex-col items-center xl:-translate-x-[calc(50%)] xl:w-[60px] pointer-events-auto xl:mr-16">
        <div className="flex xl:flex-col gap-4 rounded-full h-[50px] xl:h-auto xl:w-[60px] justify-center items-center xl:py-2 px-2 glass-buttons border border-solid border-[#E1E4EA] border-opacity-50 shadow">
          {navItems(!!accountContext.account, pathname).map((item, index) => {
            let isActive = item.isActive || pathname === item.href

            if (item.label === 'Schedule' && pathname.includes('/schedule')) {
              isActive = true
            }

            if (item.label === 'Speakers' && pathname.includes('/speakers')) {
              isActive = true
            }

            return (
              <Popover
                key={index}
                open={openPopover === item.label}
                onOpenChange={open => setOpenPopover(open ? item.label : null)}
              >
                <PopoverTrigger className="plain outline-none cursor-pointer">
                  <Link
                    href={item.href}
                    onMouseEnter={() => setOpenPopover(item.label)}
                    onMouseLeave={() => setOpenPopover(null)}
                    onClick={() => {
                      // Reset selected speaker if clicking on speakers from speakers page
                      if (item.label === 'Speakers' && pathname === '/speakers') {
                        setSelectedSpeaker(null)
                      }
                    }}
                    className={cn(
                      'flex shrink-0 items-center xl:w-[40px] xl:h-[40px] w-[38px] h-[38px] justify-center text-xl cursor-pointer rounded-full p-2.5 hover:bg-[#dfd8fc] transition-all duration-300',
                      isActive && 'bg-[#dfd8fc] fill-[#7D52F4] border border-solid border-[#cdbaff]'
                    )}
                  >
                    <item.icon style={isActive ? { fill: '#7D52F4', fontSize: item.size } : { fontSize: item.size }} />
                  </Link>
                </PopoverTrigger>

                <PopoverContent
                  className="w-auto p-1 text-sm px-2 hidden sm:block"
                  side={isSmallScreen ? 'top' : 'left'}
                  sideOffset={isSmallScreen ? 15 : 20}
                >
                  <div>{item.label}</div>
                </PopoverContent>
              </Popover>
            )
          })}
        </div>

        {/* <Popover open={openPopover === '/schedule'} onOpenChange={open => setOpenPopover(open ? '/schedule' : null)}>
          <PopoverTrigger className="plain outline-none">
            <Link
              href="/schedule"
              onMouseEnter={() => setOpenPopover('/schedule')}
              onMouseLeave={() => setOpenPopover(null)}
              className={cn(
                'shadow glass-buttons cursor-pointer flex flex-col gap-4 rounded-full justify-center items-center xl:w-[60px] xl:h-[60px] w-[50px] h-[50px] bg-[#E1E4EA73] bg-opacity-50 transition-all duration-300 hover:bg-[#EFEBFF] border border-solid border-[#E1E4EA] border-opacity-50',
                pathname === '/schedule' && '!bg-[#3a3a3a] bg-opacity-80'
              )}
            >
              <CalendarFillIcon
                style={{ fontSize: 20, '--color-icon': pathname === '/schedule' ? 'white' : '#000000' }}
              />
            </Link>
          </PopoverTrigger>

          <PopoverContent className="w-auto p-1 text-sm px-2" side={isSmallScreen ? 'top' : 'left'} sideOffset={10}>
            <div>Schedule</div>
          </PopoverContent>
        </Popover> */}

        <Popover open={openPopover === '/more'} onOpenChange={open => setOpenPopover(open ? '/more' : null)}>
          <PopoverTrigger className="plain outline-none" onClick={() => setDevaBotVisible(true)}>
            <div
              onMouseEnter={() => setOpenPopover('/more')}
              onMouseLeave={() => setOpenPopover(null)}
              className="shadow glass-buttons cursor-pointer flex flex-col gap-4 rounded-full justify-center items-center xl:w-[60px] xl:h-[60px] w-[50px] h-[50px] bg-[#784DEF1A] bg-opacity-20 transition-all duration-300 hover:bg-[#EFEBFF] border border-solid border-[#E1E4EA]"
            >
              <AppIcons style={{ fontSize: 40 }} />

              {notificationsCount > 0 && (
                <div className="absolute -top-[1px] -right-[1.5px] bg-[#7D52F4] text-white rounded-full w-5 h-5 md:w-[1.1rem] md:h-[1.1rem] lg:-top-0.5 lg:-right-0.5 flex items-center justify-center text-xs lg:text-[12px]">
                  {notificationsCount}
                </div>
              )}
            </div>
          </PopoverTrigger>

          <PopoverContent
            className="w-auto p-1 text-sm px-2 hidden lg:block"
            side={isSmallScreen ? 'top' : 'left'}
            sideOffset={10}
          >
            <div>Guide</div>
            {/* <PopoverArrow style={{ fill: 'white' }} /> */}
          </PopoverContent>
        </Popover>
      </div>
    </div>
  )
}

export const AppLayout = (
  props: {
    showLogin?: boolean
    pageTitle: string
    renderActions?: () => React.ReactNode
    breadcrumbs: HeaderProps['breadcrumbs']
  } & PropsWithChildren
) => {
  // const headerHeight = useGetElementHeight('header')
  // const upperNavHeight = useGetElementHeight('inline-nav')
  // const lowerNavHeight = useGetElementHeight('bottom-nav')
  // const layoutContainerRef = useRef<HTMLDivElement>(null)

  const [selectedSpeaker, _] = useRecoilState(selectedSpeakerAtom)
  const [selectedSession, __] = useRecoilState(selectedSessionAtom)
  const pathname = usePathname()

  const deprioritizeHeader =
    (pathname.includes('/speakers') && selectedSpeaker !== null) ||
    (pathname.includes('/schedule') && !selectedSession !== null)

  return (
    <>
      <div
        id="layout-container"
        className={css['app']}
        // ref={layoutContainerRef}
        //   {
        //     '--header-height': `${headerHeight}px`,
        //     '--app-nav-upper-height': `${upperNavHeight || 49}px`,
        //     '--app-nav-lower-height': `${lowerNavHeight}px`,
        //   } as any
        // }
      >
        <Header pageTitle={props.pageTitle} breadcrumbs={props.breadcrumbs} renderActions={props.renderActions} />

        {/* <Image
          src={LoginBackdrop}
          alt="Login Backdrop"
          className={cn(
            'object-contain absolute inset-0 h-[150%] w-full -translate-y-[16vh] lg:translate-y-0 pointer-events-none z-[1] mask-sideways'
          )}
          quality={100}
          priority
        /> */}

        <div className={cn('section pt-5 relative z-10 page-background', deprioritizeHeader && 'z-auto')}>
          <div className="flex flex-col xl:flex-row gap-0 relative max-w-full !col-start-1 !col-end-4 lg:!col-start-2 lg:!col-end-3">
            <div
              data-type="page-content"
              className="xl:order-2 grow relative shrink-0 max-w-full"
              style={{ paddingBottom: 'calc(80px + max(24px, env(safe-area-inset-bottom)))' }}
            >
              {props.children}
            </div>
            <Navigation />
          </div>
        </div>
      </div>
    </>
  )
}
