require 'json'

package = JSON.parse(File.read(File.join(__dir__, 'package.json')))

Pod::Spec.new do |s|
  s.name         = 'hecom-rn-reportTable'
  s.version      = package['version']
  s.summary      = package['description']
  s.authors      = { "VampireGod" => "mashuai_hy@163.com" }
  s.homepage     = package['homepage']
  s.license      = package['license']
  s.platform     = :ios, "13.0"
  s.source       = { :git => "https://github.com/hecom-rn/ReportTable.git" }
  s.source_files = 'ios/*.{h,m,mm}'
  s.resources    = 'ios/ReportTable.bundle'

  # Codegen spec location (used by React Native's codegen pipeline)
  s.pod_target_xcconfig = {
    "DEFINES_MODULE" => "YES",
    "SWIFT_COMPILATION_MODE" => "wholemodule"
  }

  # install_modules_dependencies handles both old and new architecture automatically
  install_modules_dependencies(s)

  # Third-party dependencies (unchanged from original)
  s.dependency 'ZMJGanttChart'
  s.dependency 'Masonry'
end
