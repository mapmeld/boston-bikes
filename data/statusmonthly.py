#StatusChanges.py
# summarize 1.41 GB of Bike share station status into updates of availability / capacity over time

status = open('stationstatus.csv','r')

headers = status.readline()

stations = { }
months = { }

while(True):
  line = status.readline().split(',')
  
  station_id = line[1]
  time = line[2]
  bikes = line[3]
  capacity = line[5]

  day = line[2].split(' ')[0]
  month = day.split('-')[0] + '-' + day.split('-')[1]
  
  if(stations.has_key(station_id)):
    newmonth = 0
    lastmonth = stations[station_id][0]
    if(month != lastmonth):
      newmonth = 1
      lastmonth = month
    if(months.has_key(month) == False):
      months[month] = open(month + '.csv', 'w')

    lastday = stations[station_id][1]
    if(day != lastday):
      if(lastday != None):
        if(newmonth == 1 or stations[station_id][2] != bikes or stations[station_id][3] != capacity):
          months[month].write(day.replace('-','/') + ',' + station_id + ',' + stations[station_id][2] + ',' + stations[station_id][3])
      stations[station_id][1] = day
      stations[station_id][2] = bikes
      stations[station_id][3] = capacity
      newmonth = 0
  else:
    stations[ station_id ] = [ month, day, bikes, capacity ]