require 'json'

package = JSON.parse(File.read(File.join(__dir__, 'package.json')))

Pod::Spec.new do |s|
  s.name         = 'hecom-rn-reportTable'
  s.version      = package['version']
  s.summary      = package['description']
  s.authors      = { "VampireGod" => "mashuai_hy@163.com" }
  s.homepage     = package['homepage']
  s.license      = package['license']
  s.platform     = :ios, "9.0"
  s.source       = { :git => "https://github.com/hecom-rn/ReportTable.git" }
  s.source_files = 'ios/**/*.{h,m}'
  s.dependency 'ZMJGanttChart', :git => 'https://github.com/GodVampire/ZMJGanttChart.git'
end